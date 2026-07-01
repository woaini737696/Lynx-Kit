/**
 * KMS 抽象接口
 *
 * 用于加密用户敏感数据（SSH 密码、SSH 密钥等）。
 * 实现可替换：
 *   - 本地：LocalKMS（AES-256-GCM，开发期使用）
 *   - 云端：AliyunKMS / AwsKMS（生产期使用）
 */

export interface KMS {
  /**
   * 加密明文
   * @param plain 明文字符串
   * @returns 加密后的密文（包含 IV、authTag，Base64 编码）
   */
  encrypt(plain: string): Promise<string>;

  /**
   * 解密密文
   * @param cipher 密文（Base64 编码）
   * @returns 明文字符串
   * @throws 解密失败时抛出
   */
  decrypt(cipher: string): Promise<string>;
}

/**
 * KMS 工厂配置
 */
export interface KMSConfig {
  /** 实现类型 */
  type: "local" | "aliyun" | "aws";
  /** 本地实现使用的主密钥（32 字节 hex 字符串，64 字符） */
  masterKey?: string;
  /** 云 KMS 密钥 ID */
  keyId?: string;
  /** 云 KMS 访问凭证 */
  accessKeyId?: string;
  accessKeySecret?: string;
  region?: string;
}

/**
 * KMS 错误
 */
export class KMSError extends Error {
  constructor(message: string, public readonly code: string = "KMS_ERROR") {
    super(message);
    this.name = "KMSError";
  }
}
