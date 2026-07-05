import Link from "next/link";
import { Sparkles, X } from "lucide-react";

/**
 * 认证页布局 · iOS26 极简黑白灰
 *
 * - 全屏居中弹窗
 * - 背景：极简灰白渐变光晕 + 强毛玻璃模糊
 * - 卡片：强毛玻璃质感（bg-white/72 backdrop-blur-2xl）
 * - 顶部品牌 + 右上角圆形玻璃关闭按钮
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-white dark:bg-ink-950">
      {/* 背景装饰光晕 - 极简灰白（单层简化） */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink-100/60 blur-3xl dark:bg-ink-800/15"
      />

      {/* 顶部品牌 - 黑色方块 logo */}
      <div className="absolute left-6 top-6 z-10 flex items-center gap-2.5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-950 shadow-sm dark:bg-ink-100">
            <Sparkles className="h-5 w-5 text-white dark:text-ink-950" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-ink-900 dark:text-ink-50">
            妙想
          </span>
        </Link>
      </div>

      {/* 右上角圆形玻璃关闭按钮 */}
      <Link
        href="/"
        aria-label="返回首页"
        className="absolute right-6 top-6 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/55 text-ink-600 backdrop-blur-xl backdrop-saturate-150 transition hover:bg-white/72 hover:text-ink-950 dark:border-white/10 dark:bg-white/10 dark:text-ink-300 dark:hover:bg-white/20 dark:hover:text-ink-50"
      >
        <X className="h-4 w-4" />
      </Link>

      {/* 全屏居中弹窗卡片 - 强毛玻璃 */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md rounded-[28px] border border-white/70 bg-white/72 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.2),0_1px_0_rgba(255,255,255,0.8)_inset] backdrop-blur-2xl backdrop-saturate-200 dark:border-white/10 dark:bg-ink-900/72 sm:p-10">
          {/* 顶部 Slogan - 极简黑 */}
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-[-0.02em] text-ink-950 dark:text-ink-50">
              从灵感到上线，全流程零门槛。
            </h2>
          </div>
          {children}
        </div>
      </div>

      {/* 底部版权 */}
      <p className="absolute bottom-4 left-0 right-0 z-10 text-center text-xs text-ink-400 dark:text-ink-500">
        © {new Date().getFullYear()} 妙想. 保留所有权利。
      </p>
    </div>
  );
}
