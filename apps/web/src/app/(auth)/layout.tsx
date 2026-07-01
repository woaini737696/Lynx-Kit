import Link from "next/link";
import { Boxes } from "lucide-react";

import { APP_CONFIG } from "@lynxkit/shared";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* 左侧品牌展示（移动端隐藏） */}
      <aside className="relative hidden w-1/2 flex-col justify-between bg-gradient-to-br from-lynx-500 via-lynx-600 to-lynx-700 p-12 text-white lg:flex">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.4) 0, transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.3) 0, transparent 40%)",
        }} />
        <Link href="/" className="relative flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
            <Boxes className="h-5 w-5" />
          </span>
          <span className="text-xl font-bold">{APP_CONFIG.name}</span>
        </Link>

        <div className="relative">
          <h2 className="text-4xl font-extrabold leading-tight">
            {APP_CONFIG.tagline}
          </h2>
          <p className="mt-4 max-w-md text-lg text-white/80">
            不会代码，也能独立做产品。从想法到上线，一切交给 LynxKit。
          </p>
          <div className="mt-8 flex items-center gap-6 text-sm text-white/70">
            <div>
              <div className="text-2xl font-bold text-white">6+</div>
              产品模板
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div>
              <div className="text-2xl font-bold text-white">0</div>
              运维成本
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div>
              <div className="text-2xl font-bold text-white">100%</div>
              源码拥有
            </div>
          </div>
        </div>

        <p className="relative text-sm text-white/60">
          © {new Date().getFullYear()} {APP_CONFIG.name}
        </p>
      </aside>

      {/* 右侧表单卡片 */}
      <main className="flex w-full items-center justify-center bg-zinc-50 px-4 py-12 lg:w-1/2">
        <div className="w-full max-w-md animate-slide-up">{children}</div>
      </main>
    </div>
  );
}
