"use client";

import { Sidebar } from "./sidebar";
import { Header } from "./header";

/**
 * 应用外壳
 *
 * 桌面端主布局：左侧导航 + 顶栏 + 主内容区。
 * 构建控制台 / 商店 / 创作者 / 设置 等页面统一套用此外壳。
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
