import { Outlet } from "react-router-dom";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

/**
 * 应用外壳
 *
 * 桌面端主布局：左侧导航 + 顶栏 + 主内容区。
 * 作为 React Router 布局路由元素使用，通过 <Outlet /> 渲染匹配的子路由。
 */
export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
