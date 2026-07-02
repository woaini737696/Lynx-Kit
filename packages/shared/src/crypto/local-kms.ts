/**
 * 本地 KMS 实现 - LynxKit v1.0
 *
 * 基于 Node.js `crypto` 模块的 AES-256-GCM。
 *
 * 加密格式：Base64( IV(12B) || authTag(16B) || ciphertext )
 *
 * 主密钥来源：环境变量 `KMS_MASTER_KEY`（32 字节 hex，64 字符）
 *
 * 适用场景：
 *   - 桌面端（Tauri / Electron）本地加密
 *   - 单机部署
 *   - 开发期调试
 *
 * 不适用：
 *   - 多实例水平扩展（需要共享主密钥，建议云 KMS）
 *   - 严格合规场景（需用云 KMS）
 */

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from "node:crypto";
import type { KMS } from "./kms";
import { KMSError } from "./kms";

const IV_LENGTH = 12; // GCM 推荐 96-bit IV
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256-bit

/**
 * 将 context 对象规范化为稳定的 AAD 字符串
 *
 * 规则：按 key 排序后 `key=value` 用 `&` 连接
 */
function serializeContext(context?: Record<string, string>): Buffer {
  if (!context) return Buffer.alloc(0);
  const keys = Object.keys(context).sort();
  if (keys.length === 0) return Buffer.alloc(0);
  const str = keys.map((k) => `${k}=${context[k] ?? ""}`).join("&");
  return Buffer.from(str, "utf8");
}

/**
 * 本地 AES-256-GCM KMS 实现
 */
export class LocalKMS implements KMS {
  private masterKey: Buffer;

  constructor(masterKeyHex: string) {
    this.masterKey = parseMasterKey(masterKeyHex);
  }

  /**
   * 从密码派生主密钥（用于初始化新环境，非生产推荐）
   */
  static deriveKeyFromPassword(
    password: string,
    salt = "lynxkit",
  ): string {
    return createHash("sha256")
      .update(`${salt}:${password}`)
      .digest()
      .toString("hex");
  }

  /**
   * 生成新的随机主密钥（32 字节 hex，64 字符）
   */
  static generateMasterKey(): string {
    return randomBytes(KEY_LENGTH).toString("hex");
  }

  /**
   * 从环境变量 `KMS_MASTER_KEY` 读取主密钥并实例化
   */
  static fromEnv(env: NodeJS.ProcessEnv = process.env): LocalKMS {
    const key = env.KMS_MASTER_KEY;
    if (!key) {
      throw new KMSError(
        "缺少环境变量 KMS_MASTER_KEY（32 字节 hex，64 字符）",
        "MISSING_MASTER_KEY",
      );
    }
    return new LocalKMS(key);
  }

  async encrypt(
    plaintext: string,
    context?: Record<string, string>,
  ): Promise<string> {
    try {
      const iv = randomBytes(IV_LENGTH);
      const cipher = createCipheriv("aes-256-gcm", this.masterKey, iv, {
        authTagLength: AUTH_TAG_LENGTH,
      });

      const aad = serializeContext(context);
      if (aad.length > 0) {
        cipher.setAAD(aad);
      }

      const encrypted = Buffer.concat([
        cipher.update(plaintext, "utf8"),
        cipher.final(),
      ]);
      const authTag = cipher.getAuthTag();

      // IV || authTag || ciphertext
      const combined = Buffer.concat([iv, authTag, encrypted]);
      return combined.toString("base64");
    } catch (err) {
      if (err instanceof KMSError) throw err;
      throw new KMSError(
        `加密失败: ${err instanceof Error ? err.message : String(err)}`,
        "ENCRYPT_FAILED",
      );
    }
  }

  async decrypt(
    ciphertext: string,
    context?: Record<string, string>,
  ): Promise<string> {
    try {
      const combined = Buffer.from(ciphertext, "base64");

      if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
        throw new KMSError("密文格式不正确", "INVALID_CIPHER");
      }

      const iv = combined.subarray(0, IV_LENGTH);
      const authTag = combined.subarray(
        IV_LENGTH,
        IV_LENGTH + AUTH_TAG_LENGTH,
      );
      const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

      const decipher = createDecipheriv("aes-256-gcm", this.masterKey, iv, {
        authTagLength: AUTH_TAG_LENGTH,
      });
      decipher.setAuthTag(authTag);

      const aad = serializeContext(context);
      if (aad.length > 0) {
        decipher.setAAD(aad);
      }

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      return decrypted.toString("utf8");
    } catch (err) {
      if (err instanceof KMSError) throw err;
      throw new KMSError(
        `解密失败: ${err instanceof Error ? err.message : String(err)}`,
        "DECRYPT_FAILED",
      );
    }
  }

  /**
   * 主密钥轮换：重新生成 32 字节随机主密钥
   *
   * 注意：调用方需要负责把旧密文逐条 decrypt + encrypt 重新加密。
   */
  async rotate(): Promise<void> {
    this.masterKey = randomBytes(KEY_LENGTH);
  }

  /**
   * 显式替换主密钥（用于从外部加载新密钥）
   */
  async rotateTo(masterKeyHex: string): Promise<void> {
    this.masterKey = parseMasterKey(masterKeyHex);
  }
}

/**
 * 校验并解析主密钥
 */
function parseMasterKey(masterKeyHex: string): Buffer {
  if (!masterKeyHex || masterKeyHex.length !== 64) {
    throw new KMSError(
      "主密钥必须为 32 字节 hex 字符串（64 字符），请检查 KMS_MASTER_KEY 环境变量",
      "INVALID_MASTER_KEY",
    );
  }
  if (!/^[0-9a-fA-F]{64}$/.test(masterKeyHex)) {
    throw new KMSError(
      "主密钥包含非 hex 字符，请检查 KMS_MASTER_KEY 环境变量",
      "INVALID_MASTER_KEY_FORMAT",
    );
  }
  const key = Buffer.from(masterKeyHex, "hex");
  if (key.length !== KEY_LENGTH) {
    throw new KMSError(
      `主密钥长度不正确，期望 ${KEY_LENGTH} 字节，实际 ${key.length} 字节`,
      "INVALID_MASTER_KEY_LENGTH",
    );
  }
  return key;
}

/**
 * 创建本地 KMS 实例
 *
 * @param masterKey 32 字节 hex 字符串（64 字符）。若省略则从 KMS_MASTER_KEY 环境变量读取。
 */
export function createLocalKMS(masterKey?: string): KMS {
  if (masterKey) {
    return new LocalKMS(masterKey);
  }
  return LocalKMS.fromEnv();
}

/**
 * 兼容旧 API：创建 KMS 实例（默认 LocalKMS）
 *
 * @deprecated 推荐使用 `createLocalKMS`
 */
export function createKMS(masterKeyHex: string): KMS {
  return new LocalKMS(masterKeyHex);
}
