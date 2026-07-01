/**
 * 密码工具
 *
 * 使用 bcryptjs 进行密码哈希与校验。
 * - hash rounds: 10（约 100ms / 次，开发期可接受）
 * - 生产环境可调整为 12 以提升安全强度
 */
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 10;

/**
 * 哈希明文密码
 * @param plain 明文密码
 * @returns bcrypt 哈希字符串
 */
export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
  return bcrypt.hash(plain, salt);
}

/**
 * 校验明文密码与哈希是否匹配
 * @param plain 明文密码
 * @param hash bcrypt 哈希字符串
 * @returns 匹配返回 true，否则 false
 */
export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  if (!plain || !hash) return false;
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}
