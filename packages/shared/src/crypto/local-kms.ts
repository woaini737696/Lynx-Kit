import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";
import type { KMS } from "./kms.js";
import { KMSError } from "./kms.js";

/**
 * 本地 KMS 实现（AES-256-GCM）
 *
 * 加密格式：Base64(IV(12B) || authTag(16B) || ciphertext)
 *
 * 适用场景：
 *   - 本地开发
 *   - 单机部署
 *   - 不要求密钥轮换的场景
 *
 * 不适用：
 *   - 多实例水平扩展（需要共享主密钥）
 *   - 严格合规场景（需用云 KMS）
 */

const IV_LENGTH = 12; // GCM 推荐 96-bit IV
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256-bit

export class LocalKMS implements KMS {
  private readonly masterKey: Buffer;

  constructor(masterKeyHex: string) {
    if (!masterKeyHex || masterKeyHex.length !== 64) {
      throw new KMSError(
        "主密钥必须为 32 字节 hex 字符串（64 字符），请检查 KMS_MASTER_KEY 环境变量",
        "INVALID_MASTER_KEY"
      );
    }
    this.masterKey = Buffer.from(masterKeyHex, "hex");
    if (this.masterKey.length !== KEY_LENGTH) {
      throw new KMSError(
        `主密钥长度不正确，期望 ${KEY_LENGTH} 字节，实际 ${this.masterKey.length} 字节`,
        "INVALID_MASTER_KEY_LENGTH"
      );
    }
  }

  /**
   * 从密码派生主密钥（用于初始化新环境）
   */
  static deriveKeyFromPassword(password: string, salt: string = "lynxkit"): Buffer {
    return createHash("sha256").update(`${salt}:${password}`).digest();
  }

  /**
   * 生成新的随机主密钥
   */
  static generateMasterKey(): string {
    return randomBytes(KEY_LENGTH).toString("hex");
  }

  async encrypt(plain: string): Promise<string> {
    try {
      const iv = randomBytes(IV_LENGTH);
      const cipher = createCipheriv("aes-256-gcm", this.masterKey, iv, {
        authTagLength: AUTH_TAG_LENGTH,
      });

      const encrypted = Buffer.concat([
        cipher.update(plain, "utf8"),
        cipher.final(),
      ]);
      const authTag = cipher.getAuthTag();

      // IV || authTag || ciphertext
      const combined = Buffer.concat([iv, authTag, encrypted]);
      return combined.toString("base64");
    } catch (err) {
      throw new KMSError(
        `加密失败: ${err instanceof Error ? err.message : String(err)}`,
        "ENCRYPT_FAILED"
      );
    }
  }

  async decrypt(cipher: string): Promise<string> {
    try {
      const combined = Buffer.from(cipher, "base64");

      if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
        throw new KMSError("密文格式不正确", "INVALID_CIPHER");
      }

      const iv = combined.subarray(0, IV_LENGTH);
      const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
      const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

      const decipher = createDecipheriv("aes-256-gcm", this.masterKey, iv, {
        authTagLength: AUTH_TAG_LENGTH,
      });
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      return decrypted.toString("utf8");
    } catch (err) {
      if (err instanceof KMSError) throw err;
      throw new KMSError(
        `解密失败: ${err instanceof Error ? err.message : String(err)}`,
        "DECRYPT_FAILED"
      );
    }
  }
}

/**
 * 创建 KMS 实例（默认 LocalKMS）
 */
export function createKMS(masterKeyHex: string): KMS {
  return new LocalKMS(masterKeyHex);
}
