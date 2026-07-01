/**
 * KMS 加密工具
 *
 * 通过共享包 @lynxkit/shared 提供的 LocalKMS 实现加密 SSH 凭证。
 * 主密钥从环境变量 KMS_MASTER_KEY 读取（必须为 64 字符 hex 字符串）。
 *
 * 生产环境可切换为云 KMS（如阿里云 KMS / AWS KMS），
 * 仅需替换 createKMS 工厂实现，调用方代码不变。
 */
import {
  createKMS,
  type KMS,
} from "@lynxkit/shared/crypto";

import { logger } from "./logger.js";

let kmsInstance: KMS | null = null;

/**
 * 获取全局 KMS 实例（单例）
 *
 * @throws 若 KMS_MASTER_KEY 未配置或格式不正确
 */
export function getKMS(): KMS {
  if (kmsInstance) return kmsInstance;

  const masterKey = process.env.KMS_MASTER_KEY;
  if (!masterKey) {
    logger.error("KMS_MASTER_KEY 环境变量未配置");
    throw new Error("KMS_MASTER_KEY 环境变量未配置，请检查 .env");
  }

  kmsInstance = createKMS(masterKey);
  logger.info("KMS 实例已初始化（LocalKMS / AES-256-GCM）");
  return kmsInstance;
}

/**
 * 加密密码
 * @param plain 明文密码
 * @returns Base64 编码的密文
 */
export async function encryptPassword(plain: string): Promise<string> {
  const kms = getKMS();
  return kms.encrypt(plain);
}

/**
 * 解密密码
 * @param cipher Base64 密文
 * @returns 明文密码
 */
export async function decryptPassword(cipher: string): Promise<string> {
  const kms = getKMS();
  return kms.decrypt(cipher);
}

/**
 * 加密 SSH 私钥
 */
export async function encryptSshKey(plain: string): Promise<string> {
  return encryptPassword(plain);
}

/**
 * 解密 SSH 私钥
 */
export async function decryptSshKey(cipher: string): Promise<string> {
  return decryptPassword(cipher);
}
