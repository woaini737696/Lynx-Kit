import { PanelLeft } from "lucide-react";
import { Button } from "@lynxkit/ui-web";
import { useUIStore } from "@lynxkit/store";
import { useLocation } from "react-router-dom";

const TITLES: Record<string, string> = {
  "/": "首页",
  "/login": "登录",
  "/register": "注册",
  "/build": "构建",
  "/store": "商店",
  "/creator": "创作者中心",
  "/settings": "设置",
  "/settings/ai-models": "AI 模型配置",
  "/settings/profile": "个人资料",
};

/**
 * 子顶栏
 *
 * 位于 TitleBar 下方，提供侧边栏折叠按钮 + 当前页面标题。
 * 主题切换与用户菜单已迁移至 TitleBar / Sidebar。
 */
export function SubHeader() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const { pathname } = useLocation();

  const title =
    TITLES[pathname] ??
    (pathname.startsWith("/build/")
      ? "构建控制台"
      : pathname.startsWith("/store/")
        ? "产品详情"
        : pathname.startsWith("/creator/")
          ? "创作者中心"
          : "LynxKit");

  return (
    <header className="flex h-11 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        aria-label="切换侧边栏"
        className="h-8 w-8"
      >
        <PanelLeft className="h-4 w-4" />
      </Button>
      <h1 className="text-sm font-medium text-foreground">{title}</h1>
    </header>
  );
}
