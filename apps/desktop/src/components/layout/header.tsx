import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  PanelLeft,
  Sun,
  Moon,
  Monitor,
  LogIn,
  LogOut,
  User,
} from "lucide-react";
import { Button, Avatar, AvatarFallback } from "@lynxkit/ui-web";
import { cn } from "@/lib/utils";
import { useUIStore, useAuthStore } from "@lynxkit/store";
import { electronAPI } from "@/lib/electron";

const THEMES = [
  { value: "light", icon: Sun, label: "亮色" },
  { value: "dark", icon: Moon, label: "暗色" },
  { value: "system", icon: Monitor, label: "跟随系统" },
] as const;

/**
 * 顶栏
 *
 * - 折叠 / 展开侧边栏
 * - 主题切换（亮 / 暗 / 跟随系统）
 * - 用户菜单：登录态显示头像，未登录显示登录按钮
 */
export function Header() {
  const navigate = useNavigate();
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const { user, isAuthenticated, logout } = useAuthStore();

  const [version, setVersion] = React.useState("");
  React.useEffect(() => {
    electronAPI?.app.getVersion().then(setVersion).catch(() => {});
  }, []);

  return (
    <header className="flex h-14 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label="切换侧边栏"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {/* 主题切换 */}
        <div className="flex items-center rounded-lg border border-border p-0.5">
          {THEMES.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTheme(t.value)}
                aria-label={t.label}
                className={cn(
                  "rounded-md p-1.5 transition",
                  theme === t.value
                    ? "bg-lynx-500/15 text-lynx-600 dark:text-lynx-400"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>

        {/* 用户 */}
        {isAuthenticated && user ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-lynx-500/10 text-xs text-lynx-600">
                {(user.name ?? user.email)[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void logout()}
              className="text-muted-foreground"
            >
              <LogOut className="mr-1.5 h-4 w-4" />
              退出
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/login")}
          >
            <LogIn className="mr-1.5 h-4 w-4" />
            登录
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/settings/profile")}
          aria-label="个人资料"
        >
          <User className="h-4 w-4" />
        </Button>

        {version && (
          <span className="hidden text-xs text-muted-foreground sm:inline">
            v{version}
          </span>
        )}
      </div>
    </header>
  );
}
