"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

/** 认证页面布局：居中卡片 + 品牌标识 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="hero-glow relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lynx-500 text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <span className="text-xl font-bold tracking-tight">LynxKit</span>
      </Link>
      {children}
    </main>
  );
}
