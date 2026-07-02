import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  Store,
  UserSquare,
  Settings,
  LogIn,
  LogOut,
  User,
  Github,
} from "lucide-react";
import { Button, Avatar, AvatarFallback } from "@lynxkit/ui-web";
import { cn } from "@/lib/utils";
import { useUIStore, useAuthStore } from "@lynxkit/store";

/**
 * 侧边导航栏
 *
 * 主导航：构建 / 商店 / 创作者 / 设置。
 * 可折叠（受 ui-store.sidebarOpen 控制）。
 *
 * 底部固定区域：
 * - 已登录：显示用户头像 + 退出按钮
 * - 未登录：显示登录入口（固定在左下角）
 */
const NAV = [
  { href: "/build", label: "构建", icon: LayoutGrid },
  { href: "/store", label: "商店", icon: Store },
  { href: "/creator", label: "创作者", icon: UserSquare },
  { href: "/settings", label: "设置", icon: Settings },
] as const;

export function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const open = useUIStore((s) => s.sidebarOpen);
  const { user, isAuthenticated, logout } = useAuthStore();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-card/40 transition-[width] duration-200",
        open ? "w-60" : "w-0 overflow-hidden",
      )}
    >
      {/* 中间导航区 */}
      <nav className="flex-1 space-y-1 p-3 pt-4">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-lynx-500/10 text-lynx-600 dark:text-lynx-400"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* 底部固定区域：登录入口 / 用户信息 */}
      <div className="border-t border-border p-3">
        {isAuthenticated && user ? (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => navigate("/settings/profile")}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-accent"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-lynx-500/10 text-xs text-lynx-600">
                  {(user.name ?? user.email)[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate text-xs font-medium text-foreground">
                  {user.name ?? user.email}
                </span>
                <span className="truncate text-[10px] text-muted-foreground">
                  已登录
                </span>
              </div>
              <User className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void logout()}
              className="w-full justify-start text-muted-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              退出登录
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => navigate("/login")}
            className="w-full bg-lynx-500 text-white hover:bg-lynx-600"
          >
            <LogIn className="mr-2 h-4 w-4" />
            登录
          </Button>
        )}

        <a
          href="https://github.com/woaini737696/Lynx-Kit"
          target="_blank"
          rel="noreferrer"
          className="mt-2 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] text-muted-foreground/70 transition hover:bg-accent hover:text-foreground"
        >
          <Github className="h-3 w-3" />
          GitHub
        </a>
      </div>
    </aside>
  );
}
