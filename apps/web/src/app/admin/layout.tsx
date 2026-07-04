"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sparkles,
  LayoutGrid,
  Users,
  Package,
  ShoppingCart,
  Activity,
  LogOut,
} from "lucide-react";
import { UserRole } from "@lynxkit/shared";
import { useAuthStore } from "@lynxkit/store";
import { Avatar, AvatarFallback, Badge, Spinner } from "@lynxkit/ui-web";
import { cn } from "@/lib/utils";

/**
 * 管理后台布局
 *
 * - 侧边栏导航：仪表盘 / 用户 / 商品 / 订单 / 监控
 * - 顶部栏：管理员信息 + 退出
 * - 权限检查：未登录或非管理员重定向到 /login
 *
 * 由于需要读取 zustand 持久化的登录态并做客户端跳转，整个布局为 client component。
 */

const NAV = [
  { href: "/admin", label: "仪表盘", icon: LayoutGrid },
  { href: "/admin/users", label: "用户", icon: Users },
  { href: "/admin/products", label: "商品", icon: Package },
  { href: "/admin/orders", label: "订单", icon: ShoppingCart },
  { href: "/admin/monitoring", label: "监控", icon: Activity },
] as const;

function isAdminRole(role?: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);

  const [checked, setChecked] = React.useState(false);

  React.useEffect(() => {
    if (!isAuthenticated || !user || !isAdminRole(user.role)) {
      router.replace("/login");
      return;
    }
    setChecked(true);
  }, [isAuthenticated, user, router]);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  // 权限校验通过前展示骨架，避免管理界面闪烁
  if (!checked || !user || !isAdminRole(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 dark:bg-ink-950">
        <Spinner className="h-6 w-6 text-ink-950 dark:text-ink-50" />
        <span className="ml-2 text-sm text-ink-500">校验权限中…</span>
      </div>
    );
  }

  const initials = (user.name ?? user.email ?? "").slice(0, 1).toUpperCase();
  const isSuper = user.role === UserRole.SUPER_ADMIN;

  return (
    <div className="relative min-h-screen bg-ink-50 dark:bg-ink-950">
      {/* 背景光晕 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-ink-200/40 blur-3xl dark:bg-ink-800/20" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-ink-300/30 blur-3xl dark:bg-ink-700/20" />
      </div>

      <div className="relative flex min-h-screen">
        {/* 侧边栏（桌面端） - 毛玻璃 */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-white/40 bg-white/55 backdrop-blur-2xl backdrop-saturate-150 dark:border-white/5 dark:bg-white/5 lg:flex">
          <div className="flex h-16 items-center gap-2.5 border-b border-ink-200/60 px-5 dark:border-ink-800/60">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink-950 text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)]">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-[-0.02em] text-ink-950 dark:text-ink-50">
              妙想
            </span>
            <Badge className="ml-auto rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-medium text-ink-600 dark:bg-ink-800 dark:text-ink-300">
              {isSuper ? "超级" : "Admin"}
            </Badge>
          </div>

          <nav className="flex-1 space-y-1 p-3">
            {NAV.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                    active
                      ? "bg-ink-950 text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)] dark:bg-ink-100 dark:text-ink-950"
                      : "text-ink-600 hover:bg-white/72 hover:text-ink-950 dark:text-ink-300 dark:hover:bg-white/10 dark:hover:text-ink-50",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-ink-200/60 p-4 text-xs text-ink-400 dark:border-ink-800/60 dark:text-ink-500">
            妙想 Admin v0.1.0
          </div>
        </aside>

        {/* 主区域 */}
        <div className="flex flex-1 flex-col">
          {/* 顶部栏 - 毛玻璃 */}
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-white/40 bg-white/55 px-4 backdrop-blur-2xl backdrop-saturate-150 sm:px-6 dark:border-white/5 dark:bg-white/5">
            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-950 text-white">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-bold tracking-[-0.02em] text-ink-950 dark:text-ink-50">
                妙想
              </span>
              <Badge className="ml-1 rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-medium text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                Admin
              </Badge>
            </div>
            <h1 className="hidden text-sm font-semibold tracking-[-0.01em] text-ink-900 lg:block dark:text-ink-50">
              管理后台
            </h1>

            <div className="ml-auto flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-ink-950 text-xs font-semibold text-white dark:bg-ink-100 dark:text-ink-950">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-medium leading-tight text-ink-900 dark:text-ink-50">
                    {user.name ?? "管理员"}
                  </p>
                  <p className="text-[11px] leading-tight text-ink-500 dark:text-ink-400">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink-200/60 bg-white/55 px-3 py-1.5 text-sm text-ink-600 backdrop-blur-xl transition-colors hover:bg-white/72 hover:text-ink-950 dark:border-ink-700/60 dark:bg-white/5 dark:text-ink-300 dark:hover:bg-white/10 dark:hover:text-ink-50"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">退出</span>
              </button>
            </div>
          </header>

          {/* 移动端横向导航 - 毛玻璃胶囊 */}
          <nav className="flex gap-1 overflow-x-auto border-b border-white/40 bg-white/55 px-3 py-2 backdrop-blur-2xl backdrop-saturate-150 lg:hidden dark:border-white/5 dark:bg-white/5">
            {NAV.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                    active
                      ? "bg-ink-950 text-white shadow-sm dark:bg-ink-100 dark:text-ink-950"
                      : "text-ink-500 hover:bg-white/72 hover:text-ink-950 dark:text-ink-400 dark:hover:bg-white/10 dark:hover:text-ink-50",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
