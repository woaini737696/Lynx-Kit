import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Sparkles,
  Sun,
  Moon,
  Monitor,
  Minus,
  Square,
  X,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@lynxkit/store";
import { electronAPI } from "@/lib/electron";
import { LanguageSwitcher } from "@/i18n/LanguageSwitcher";

const THEMES = [
  { value: "light", icon: Sun, labelKey: "titleBar.themeLight" },
  { value: "dark", icon: Moon, labelKey: "titleBar.themeDark" },
  { value: "system", icon: Monitor, labelKey: "titleBar.themeSystem" },
] as const;

/**
 * 自定义无边框窗口顶栏
 *
 * - 左侧：LOGO + 产品名称（固定在左上角，放大显示）
 * - 中间：可拖动区域（-webkit-app-region: drag）
 * - 右侧：主题切换 + 窗口控制按钮（最小化 / 最大化 / 关闭）
 *
 * 窗口控制按钮通过 electronAPI.window 调用主进程 IPC。
 */
export function TitleBar() {
  const { t } = useTranslation();
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const [isMaximized, setIsMaximized] = React.useState(false);

  React.useEffect(() => {
    electronAPI?.window?.isMaximized?.().then(setIsMaximized).catch(() => {});
    const onResize = () => {
      electronAPI?.window?.isMaximized?.().then(setIsMaximized).catch(() => {});
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleMinimize = () => {
    void electronAPI?.window?.minimize?.();
  };

  const handleMaximizeToggle = async () => {
    try {
      const next = await electronAPI?.window?.maximizeToggle?.();
      setIsMaximized(!!next);
    } catch {
      /* ignore */
    }
  };

  const handleClose = () => {
    void electronAPI?.window?.close?.();
  };

  return (
    <header
      className="relative z-50 flex h-12 items-stretch justify-between border-b border-border bg-background/95 backdrop-blur"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      {/* 左侧：LOGO + 产品名称（放大显示，固定左上角） */}
      <div className="flex items-center gap-2.5 px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-lynx-400 to-lynx-600 text-white shadow-sm">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-xl font-bold tracking-tight text-foreground">
            {t("common.brand")}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {t("common.tagline")}
          </span>
        </div>
      </div>

      {/* 中间：可拖动空白区 */}
      <div className="flex-1" />

      {/* 右侧：主题切换 + 语言切换 + 窗口控制 */}
      <div
        className="flex items-center gap-1 px-2"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        {/* 主题切换 */}
        <div className="mr-1 flex items-center rounded-lg border border-border p-0.5">
          {THEMES.map((themeOpt) => {
            const Icon = themeOpt.icon;
            return (
              <button
                key={themeOpt.value}
                type="button"
                onClick={() => setTheme(themeOpt.value)}
                aria-label={t(themeOpt.labelKey)}
                title={t(themeOpt.labelKey)}
                className={cn(
                  "rounded-md p-1.5 transition",
                  theme === themeOpt.value
                    ? "bg-lynx-500/15 text-lynx-600 dark:text-lynx-400"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>

        {/* 语言切换 */}
        <LanguageSwitcher />

        {/* 窗口控制按钮 */}
        <button
          type="button"
          onClick={handleMinimize}
          aria-label={t("titleBar.minimize")}
          title={t("titleBar.minimize")}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleMaximizeToggle}
          aria-label={isMaximized ? t("titleBar.restore") : t("titleBar.maximize")}
          title={isMaximized ? t("titleBar.restore") : t("titleBar.maximize")}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          {isMaximized ? (
            <Copy className="h-3.5 w-3.5 -scale-x-100" />
          ) : (
            <Square className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          type="button"
          onClick={handleClose}
          aria-label={t("titleBar.close")}
          title={t("titleBar.close")}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-destructive hover:text-destructive-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
