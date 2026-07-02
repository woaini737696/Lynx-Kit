/**
 * 格式化工具 - LynxKit v1.0
 *
 * 日期 / 货币 / 文件大小 等展示型格式化函数。
 * 不依赖运行时第三方库，全部基于 Intl 与原生 Date。
 */

/**
 * 将输入归一化为 Date 对象
 */
function toDate(date: Date | string | number): Date {
  return date instanceof Date ? date : new Date(date);
}

/**
 * 格式化日期（不含时间）
 *
 * @param date 日期 / 字符串 / 时间戳
 * @param locale 地区，默认 zh-CN
 * @returns 形如 "2024/1/2"
 */
export function formatDate(date: Date | string | number, locale = "zh-CN"): string {
  return toDate(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * 格式化日期时间（含时分秒，24 小时制）
 */
export function formatDateTime(
  date: Date | string | number,
  locale = "zh-CN",
): string {
  return toDate(date).toLocaleString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/**
 * 格式化货币
 *
 * @param amount 金额（元，浮点数）
 * @param currency 货币代码，默认 CNY
 * @returns 形如 "￥1,234.50"
 */
export function formatCurrency(amount: number, currency = "CNY"): string {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * 格式化金额（分 → 元，含货币符号）
 *
 * @param amountCents 金额（分，整数）
 * @param currency 货币代码，默认 CNY
 */
export function formatCurrencyFromCents(amountCents: number, currency = "CNY"): string {
  return formatCurrency(amountCents / 100, currency);
}

/**
 * 格式化文件大小
 *
 * @param bytes 字节数
 * @returns 形如 "1.50 MB"
 */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(k)),
    sizes.length - 1,
  );
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * 格式化相对时间（"刚刚"、"5 分钟前"、"3 小时前" 等）
 *
 * @param date 基准时间
 * @returns 中文相对时间字符串
 */
export function formatRelativeTime(date: Date | string | number): string {
  const d = toDate(date);
  const now = Date.now();
  const diff = now - d.getTime();
  const past = diff >= 0;
  const abs = Math.abs(diff);
  const seconds = Math.floor(abs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const suffix = past ? "前" : "后";
  if (seconds < 60) return past ? "刚刚" : "即将";
  if (minutes < 60) return `${minutes} 分钟${suffix}`;
  if (hours < 24) return `${hours} 小时${suffix}`;
  if (days < 30) return `${days} 天${suffix}`;
  return formatDateTime(d);
}

/**
 * 格式化持续时间（秒 → "1 分 30 秒"）
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} 秒`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes} 分 ${remainingSeconds} 秒`
      : `${minutes} 分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0
    ? `${hours} 小时 ${remainingMinutes} 分`
    : `${hours} 小时`;
}

/**
 * 掩码邮箱（a***@example.com）
 */
export function maskEmail(email: string): string {
  const atIndex = email.indexOf("@");
  if (atIndex < 1) return email;
  const name = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  if (!domain) return email;
  if (name.length <= 2) return `${name.charAt(0)}***@${domain}`;
  return `${name.slice(0, 2)}***@${domain}`;
}

/**
 * 掩码手机号（138****8888）
 */
export function maskPhone(phone: string): string {
  if (phone.length < 7) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

/**
 * 截断字符串并加省略号
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 1)}…`;
}
