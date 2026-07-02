/**
 * KMS 抽象接口 - LynxKit v1.0
 *
 * 用于加密用户敏感数据（AI Provider apiKey、第三方凭证等）。
 *
 * 实现可替换：
 *   - 本地：LocalKMS（AES-256-GCM，桌面端 / 单机部署）
 *   - 云端：AliyunKMS / AwsKMS / TencentKMS（生产期使用）
 *
 * 接口支持：
 *   - encrypt/decrypt：加密 / 解密
 *   - context：附加认证数据（AAD），用于绑定密文与业务上下文
 *   - rotate：主密钥轮换（重新加密所有数据时使用）
 */

/**
 * KMS 错误
 */
export class KMSError extends Error {
  constructor(
    message: string,
    public readonly code: string = "KMS_ERROR",
  ) {
    super(message);
    this.name = "KMSError";
  }
}

/**
 * KMS 抽象接口
 */
export interface KMS {
  /**
   * 加密明文
   *
   * @param plaintext 明文字符串
   * @param context 附加认证数据（AAD），用于绑定密文与业务上下文（如 userId），
   *                解密时必须传入相同 context 才能成功
   * @returns 密文（Base64 编码，自包含 IV 与 authTag）
   */
  encrypt(
    plaintext: string,
    context?: Record<string, string>,
  ): Promise<string>;

  /**
   * 解密密文
   *
   * @param ciphertext 密文（Base64 编码）
   * @param context 附加认证数据（必须与 encrypt 时一致）
   * @returns 明文字符串
   * @throws KMSError 解密失败时抛出
   */
  decrypt(
    ciphertext: string,
    context?: Record<string, string>,
  ): Promise<string>;

  /**
   * 主密钥轮换
   *
   * 触发底层 KMS 重新生成主密钥。已加密的旧密文需要由调用方
   * 逐条 decrypt + encrypt 重新加密。
   */
  rotate(): Promise<void>;
}

/**
 * KMS 工厂配置
 */
export interface KMSConfig {
  /** 实现类型 */
  type: "local" | "aliyun" | "aws" | "tencent";
  /** 本地实现使用的主密钥（32 字节 hex 字符串，64 字符） */
  masterKey?: string;
  /** 云 KMS 密钥 ID */
  keyId?: string;
  /** 云 KMS 访问凭证 */
  accessKeyId?: string;
  accessKeySecret?: string;
  region?: string;
}
