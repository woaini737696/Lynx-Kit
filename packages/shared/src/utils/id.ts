/**
 * ID 生成工具
 */

/**
 * 生成 CUID（兼容 Prisma 默认 ID 格式）
 *
 * Week 1 简化版：基于时间戳 + 随机数
 * 生产环境应使用 @paralleldrive/cuid2
 */
export function generateId(prefix: string = ""): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  const id = `c${timestamp}${random}`;
  return prefix ? `${prefix}_${id}` : id;
}

/**
 * 生成短 ID（用于分享链接等）
 */
export function generateShortId(length: number = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 生成随机字符串（用于密钥、token 等）
 */
export function generateRandomString(length: number = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const cryptoObj = typeof crypto !== "undefined" ? crypto : require("crypto").webcrypto;
  const values = new Uint32Array(length);
  cryptoObj.getRandomValues(values);
  for (let i = 0; i < length; i++) {
    result += chars.charAt(values[i] % chars.length);
  }
  return result;
}
