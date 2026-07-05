import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import { useAuthModal } from "@/store/auth-modal";

/**
 * 侧边导航栏
 *
 * 主导航：构建 / 商店 / 创作者 / 设置。
 * 可折叠（受 ui-store.sidebarOpen 控制）。
 *
 * 底部固定区域：
 * - 已登录：显示用户头像 + 退出按钮
 * - 未登录：显示登录入口（点击触发 AuthModal，不再路由跳转）
 */
const NAV = [
  { href: "/build", labelKey: "nav.build", icon: LayoutGrid },
  { href: "/store", labelKey: "nav.store", icon: Store },
  { href: "/creator", labelKey: "nav.creator", icon: UserSquare },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
] as const;

export function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const open = useUIStore((s) => s.sidebarOpen);
  const { user, isAuthenticated, logout } = useAuthStore();
  const openAuthModal = useAuthModal((s) => s.openAuthModal);

  return (
    <aside
      className={cn(
        "glass-card flex h-full flex-col rounded-none border-x-0 border-y-0 transition-[width] duration-200",
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
                "flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition-all duration-200 hover:-translate-y-px",
                active
                  ? "bg-ink-950 text-ink-0 dark:bg-ink-100 dark:text-ink-950"
                  : "text-ink-600 hover:bg-ink-100 hover:text-ink-950 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-100",
              )}
            >
              <Icon className="h-4 w-4" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      {/* 底部固定区域：登录入口 / 用户信息 */}
      <div className="border-t border-ink-200/60 p-3 dark:border-ink-800/60">
        {isAuthenticated && user ? (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => navigate("/settings/profile")}
              className="flex w-full items-center gap-2 rounded-full px-2 py-2 text-left text-sm transition-all duration-200 hover:-translate-y-px hover:bg-ink-100 dark:hover:bg-ink-800"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-ink-950 text-xs text-ink-0 dark:bg-ink-100 dark:text-ink-950">
                  {(user.name ?? user.email ?? "")[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate text-xs font-medium text-ink-900 dark:text-ink-100">
                  {user.name ?? user.email}
                </span>
                <span className="truncate text-[10px] text-ink-500 dark:text-ink-400">
                  {t("nav.loggedIn")}
                </span>
              </div>
              <User className="h-3.5 w-3.5 text-ink-500 dark:text-ink-400" />
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void logout()}
              className="w-full justify-start text-ink-600 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t("nav.logout")}
            </Button>
          </div>
        ) : (
          // 未登录：登录按钮（纯黑底白字，符合 DESIGN_SYSTEM §5.1 黑白灰）
          // 用原生 button + .btn-ink 而非 shadcn Button 默认变体，
          // 避免被 bg-primary 工具类覆盖为品牌橙色
          <button
            type="button"
            onClick={() => openAuthModal("login")}
            className="btn-ink flex w-full items-center justify-center gap-2 border-0"
          >
            <LogIn className="h-4 w-4" />
            {t("nav.login")}
          </button>
        )}

        <a
          href="https://github.com/woaini737696/Lynx-Kit"
          target="_blank"
          rel="noreferrer"
          className="mt-2 flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] text-ink-500 transition hover:bg-ink-100 hover:text-ink-900 dark:text-ink-500 dark:hover:bg-ink-800 dark:hover:text-ink-100"
        >
          <Github className="h-3 w-3" />
          GitHub
        </a>
      </div>
    </aside>
  );
}
