import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn - 合并 className 并处理 Tailwind 冲突
 *
 * 与 @lynxkit/ui-web 的 cn 实现保持一致。
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** 格式化日期为 YYYY-MM-DD HH:mm */
export function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso;
  }
}

/** 格式化日期为 YYYY-MM-DD */
export function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  } catch {
    return iso;
  }
}

/** 金额：分 → 元（保留两位小数） */
export function formatPrice(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`;
}

/** 金额：分 → 紧凑展示（万、亿） */
export function formatCompactPrice(cents: number): string {
  const yuan = cents / 100;
  if (yuan >= 1_0000_0000) return `¥${(yuan / 1_0000_0000).toFixed(2)}亿`;
  if (yuan >= 1_0000) return `¥${(yuan / 1_0000).toFixed(2)}万`;
  return `¥${yuan.toFixed(2)}`;
}

/** 数字紧凑展示（万、亿） */
export function formatCompactNumber(n: number): string {
  if (n >= 1_0000_0000) return `${(n / 1_0000_0000).toFixed(2)}亿`;
  if (n >= 1_0000) return `${(n / 1_0000).toFixed(2)}万`;
  return String(n);
}
