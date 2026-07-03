import Link from "next/link";
import { Sparkles, X } from "lucide-react";

/**
 * 认证页布局（全屏居中弹窗 + 毛玻璃背景）
 *
 * 用户访问 /login 或 /register 时，背景为带渐变光晕的模糊画面，
 * 前景为一张半透明毛玻璃质感的卡片，居中显示。
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted">
      {/* 背景装饰光晕（提供模糊所需的底色） */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-lynx-500/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-40 h-[36rem] w-[36rem] rounded-full bg-fuchsia-500/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400/20 blur-3xl"
      />

      {/* 顶部品牌 + 关闭按钮（点击返回首页） */}
      <div className="absolute left-6 top-6 z-10 flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-lynx-500 to-lynx-600 text-white shadow-lg shadow-lynx-500/30">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight text-foreground">
            妙想
          </span>
        </Link>
      </div>

      <Link
        href="/"
        aria-label="返回首页"
        className="absolute right-6 top-6 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/60 text-muted-foreground backdrop-blur transition hover:bg-background hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </Link>

      {/* 全屏居中弹窗卡片（毛玻璃） */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md rounded-2xl border border-white/40 bg-white/70 p-8 shadow-2xl shadow-black/10 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/70 sm:p-10">
          {/* 顶部 Slogan */}
          <div className="mb-8 text-center">
            <h2 className="bg-gradient-to-r from-lynx-600 to-fuchsia-600 bg-clip-text text-2xl font-bold tracking-tight text-transparent dark:from-lynx-400 dark:to-fuchsia-400">
              从灵感到上线，全流程零门槛。
            </h2>
          </div>
          {children}
        </div>
      </div>

      {/* 底部版权 */}
      <p className="absolute bottom-4 left-0 right-0 z-10 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} 妙想. 保留所有权利。
      </p>
    </div>
  );
}
