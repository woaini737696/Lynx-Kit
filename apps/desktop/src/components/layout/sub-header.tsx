import { PanelLeft } from "lucide-react";
import { Button } from "@lynxkit/ui-web";
import { useUIStore } from "@lynxkit/store";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

/**
 * 子顶栏
 *
 * 位于 TitleBar 下方，提供侧边栏折叠按钮 + 当前页面标题。
 * 主题切换与用户菜单已迁移至 TitleBar / Sidebar。
 */
export function SubHeader() {
  const { t } = useTranslation();
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const { pathname } = useLocation();

  const titleMap: Record<string, string> = {
    "/": t("nav.home"),
    "/login": t("nav.login"),
    "/register": t("auth.registerTitle"),
    "/build": t("nav.build"),
    "/store": t("nav.store"),
    "/creator": t("nav.creatorCenter"),
    "/settings": t("nav.settings"),
    "/settings/ai-models": t("settings.aiModelsTitle"),
    "/settings/profile": t("settings.profile"),
    "/settings/notifications": t("settings.notificationsTitle"),
    "/settings/about": t("settings.about"),
  };

  const title =
    titleMap[pathname] ??
    (pathname.startsWith("/build/")
      ? t("build.consoleTitle")
      : pathname.startsWith("/store/")
        ? t("store.productDetail")
        : pathname.startsWith("/creator/")
          ? t("nav.creatorCenter")
          : t("common.brand"));

  return (
    <header className="flex h-11 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        aria-label={t("common.close")}
        className="h-8 w-8"
      >
        <PanelLeft className="h-4 w-4" />
      </Button>
      <h1 className="text-sm font-medium text-foreground">{title}</h1>
    </header>
  );
}
