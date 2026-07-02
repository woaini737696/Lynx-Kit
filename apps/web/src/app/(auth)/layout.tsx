import Link from "next/link";
import { Sparkles } from "lucide-react";

/**
 * 认证页布局
 *
 * 简洁的左右双栏：左侧品牌区，右侧表单区。
 * 移动端只显示表单区。
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* 品牌区（仅大屏可见） */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-lynx-500 via-lynx-600 to-lynx-700 p-10 text-white lg:flex">
        <div
          aria-hidden
          className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-black/10 blur-3xl"
        />

        <Link href="/" className="relative flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="text-xl font-bold tracking-tight">LynxKit</span>
        </Link>

        <div className="relative">
          <h1 className="text-3xl font-bold leading-tight">
            AI 时代，
            <br />
            人人都是造物主
          </h1>
          <p className="mt-4 max-w-sm text-white/80">
            加入 LynxKit，开始你的造物之旅。一句话描述你的想法，
            AI 帮你从架构到代码再到部署一站完成。
          </p>

          <ul className="mt-8 space-y-2 text-sm text-white/90">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              9 层 Agent 流水线
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              8 类产品类型支持
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              永久免费档，无需信用卡
            </li>
          </ul>
        </div>

        <p className="relative text-xs text-white/60">
          © {new Date().getFullYear()} LynxKit. 保留所有权利。
        </p>
      </aside>

      {/* 表单区 */}
      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
