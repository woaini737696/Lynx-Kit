import { Outlet } from "react-router-dom";
import { Sidebar } from "./sidebar";
import { TitleBar } from "./title-bar";
import { SubHeader } from "./sub-header";

/**
 * 应用外壳
 *
 * 桌面端主布局（无边框窗口）：
 * - 顶部：自定义 TitleBar（LOGO + 窗口控制，可拖动）
 * - 中间：左侧导航 + 子顶栏（侧边栏切换 + 页面标题） + 主内容区
 */
export function AppShell() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <TitleBar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <SubHeader />
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
