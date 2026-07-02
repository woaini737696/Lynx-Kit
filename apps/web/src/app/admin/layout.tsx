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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="h-6 w-6 text-lynx-500" />
        <span className="ml-2 text-sm text-muted-foreground">校验权限中…</span>
      </div>
    );
  }

  const initials = (user.name ?? user.email).slice(0, 1).toUpperCase();
  const isSuper = user.role === UserRole.SUPER_ADMIN;

  return (
    <div className="flex min-h-screen bg-background">
      {/* 侧边栏（桌面端） */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card/40 lg:flex">
        <div className="flex h-14 items-center gap-2 border-b border-border px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lynx-500 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold tracking-tight">LynxKit</span>
          <Badge variant="secondary" className="ml-auto">
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

        <div className="border-t border-border p-3 text-xs text-muted-foreground">
          LynxKit Admin v0.1.0
        </div>
      </aside>

      {/* 主区域 */}
      <div className="flex flex-1 flex-col">
        {/* 顶部栏 */}
        <header className="flex h-14 items-center gap-3 border-b border-border bg-card/40 px-4 sm:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-lynx-500 text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-bold tracking-tight">LynxKit</span>
            <Badge variant="secondary" className="ml-1">
              Admin
            </Badge>
          </div>
          <h1 className="hidden text-sm font-semibold lg:block">管理后台</h1>

          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-lynx-500/10 text-xs font-medium text-lynx-600 dark:text-lynx-400">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-right sm:block">
                <p className="text-xs font-medium leading-tight">
                  {user.name ?? "管理员"}
                </p>
                <p className="text-[11px] leading-tight text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">退出</span>
            </button>
          </div>
        </header>

        {/* 移动端横向导航 */}
        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card/40 px-3 py-2 lg:hidden">
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
                  "inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition",
                  active
                    ? "bg-lynx-500/10 text-lynx-600 dark:text-lynx-400"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
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
  );
}
