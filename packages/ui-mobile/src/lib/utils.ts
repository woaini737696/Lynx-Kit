import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn —— 合并 className，融合 clsx 条件化与 tailwind-merge 去重。
 * 所有 ui-mobile 组件统一通过该工具拼接类名（NativeWind 兼容）。
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
