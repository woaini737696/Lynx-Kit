/**
 * 校验工具 - LynxKit v1.0
 *
 * email / phone / password 强度 / url 校验，纯函数无副作用。
 */

/**
 * 校验邮箱格式
 */
export function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

/**
 * 校验中国大陆手机号
 */
export function isPhone(s: string): boolean {
  return /^1[3-9]\d{9}$/.test(s);
}

/**
 * 校验 URL
 */
export function isUrl(s: string): boolean {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

/**
 * 密码强度评估结果
 */
export interface PasswordStrength {
  /** 0~4 强度评分 */
  score: number;
  /** 改进建议（score < 4 时给出） */
  suggestions: string[];
}

/**
 * 评估密码强度
 *
 * 评分规则（累计加分，满分 4 分）：
 *  - 长度 >= 8：+1
 *  - 长度 >= 12：再 +1
 *  - 包含大写字母：+1
 *  - 包含数字：+1
 *  - 包含特殊字符：+1（上限 4）
 *
 * @returns score 0~4 与改进建议
 */
export function isStrongPassword(s: string): PasswordStrength {
  let score = 0;
  const suggestions: string[] = [];

  if (s.length >= 8) {
    score += 1;
  } else {
    suggestions.push("密码至少 8 位");
  }

  if (s.length >= 12) {
    score += 1;
  } else if (s.length >= 8) {
    suggestions.push("建议密码长度达到 12 位以上");
  }

  if (/[A-Z]/.test(s)) {
    score += 1;
  } else {
    suggestions.push("需包含大写字母");
  }

  if (/\d/.test(s)) {
    score += 1;
  } else {
    suggestions.push("需包含数字");
  }

  if (/[^A-Za-z0-9]/.test(s)) {
    // 特殊字符作为加分项，但上限 4
    if (score < 4) score += 1;
  } else {
    suggestions.push("建议包含特殊字符");
  }

  // 上限 4
  if (score > 4) score = 4;

  return { score, suggestions };
}

/**
 * 判断密码是否通过最低强度（score >= 3）
 */
export function isPasswordAcceptable(s: string): boolean {
  return isStrongPassword(s).score >= 3;
}

/**
 * 校验 IPv4 地址
 */
export function isIp(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    const n = Number(part);
    return Number.isInteger(n) && n >= 0 && n <= 255 && part === String(n);
  });
}
