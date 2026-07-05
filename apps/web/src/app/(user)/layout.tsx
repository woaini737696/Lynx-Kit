"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sparkles,
  Crown,
  Coins,
  ShoppingBag,
  Settings,
  LogOut,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";
import { useAuthStore } from "@lynxkit/store";
import { Avatar, AvatarFallback, Spinner } from "@lynxkit/ui-web";
import { cn } from "@/lib/utils";

/**
 * 用户中心布局 · iOS26 极简黑白灰 + Liquid Glass
 *
 * - 顶部导航：返回首页 + 用户信息 + 退出登录
 * - 侧边导航（桌面端）：会员中心 / 我的 S 币 / 我的订单（占位） / 账户设置（占位）
 * - 移动端：横向胶囊导航
 * - 权限检查：未登录重定向到 /login
 *
 * 由于需要读取 zustand 持久化的登录态并做客户端跳转，整个布局为 client component。
 */

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** 占位项：表示该入口尚未开发，禁用点击 */
  placeholder?: boolean;
}

const NAV: NavItem[] = [
  { href: "/membership", label: "会员中心", icon: Crown },
  { href: "/membership#scoin", label: "我的 S 币", icon: Coins },
  { href: "#", label: "我的订单", icon: ShoppingBag, placeholder: true },
  { href: "#", label: "账户设置", icon: Settings, placeholder: true },
];

export default function UserLayout({
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
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }
    setChecked(true);
  }, [isAuthenticated, user, router]);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  // 权限校验通过前展示骨架，避免用户界面闪烁
  if (!checked || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 dark:bg-ink-950">
        <Spinner className="h-6 w-6 text-ink-950 dark:text-ink-50" />
        <span className="ml-2 text-sm text-ink-500">校验登录态…</span>
      </div>
    );
  }

  const initials = (user.name ?? user.phone ?? "").slice(0, 1).toUpperCase();

  return (
    <div className="relative min-h-screen bg-ink-50 dark:bg-ink-950">
      <div className="relative flex min-h-screen">
        {/* 侧边栏（桌面端） - 毛玻璃 */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-white/40 bg-white/55 backdrop-blur-2xl backdrop-saturate-150 dark:border-white/5 dark:bg-white/5 lg:flex">
          <div className="flex h-16 items-center gap-2.5 border-b border-ink-200/60 px-5 dark:border-ink-800/60">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink-950 text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)] dark:bg-ink-100 dark:text-ink-950">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="text-lg font-bold tracking-[-0.02em] text-ink-950 dark:text-ink-50">
                妙想
              </span>
            </Link>
            <span className="ml-auto rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-medium text-ink-600 dark:bg-ink-800 dark:text-ink-300">
              用户中心
            </span>
          </div>

          <nav className="flex-1 space-y-1 p-3">
            {NAV.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              if (item.placeholder) {
                return (
                  <div
                    key={item.label}
                    className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-300 dark:text-ink-600"
                    title="敬请期待"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                    <span className="ml-auto rounded-full bg-ink-100 px-1.5 py-0.5 text-[10px] text-ink-400 dark:bg-ink-800 dark:text-ink-500">
                      敬请期待
                    </span>
                  </div>
                );
              }
              return (
                <Link
                  key={item.label}
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
            妙想 User v0.1.0
          </div>
        </aside>

        {/* 主区域 */}
        <div className="flex flex-1 flex-col">
          {/* 顶部栏 - 毛玻璃 */}
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-white/40 bg-white/55 px-4 backdrop-blur-2xl backdrop-saturate-150 sm:px-6 dark:border-white/5 dark:bg-white/5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-ink-200/60 bg-white/55 px-3 py-1.5 text-sm text-ink-600 backdrop-blur-xl transition-colors hover:bg-white/72 hover:text-ink-950 dark:border-ink-700/60 dark:bg-white/5 dark:text-ink-300 dark:hover:bg-white/10 dark:hover:text-ink-50"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">返回首页</span>
            </Link>

            <div className="ml-auto flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-ink-950 text-xs font-semibold text-white dark:bg-ink-100 dark:text-ink-950">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-medium leading-tight text-ink-900 dark:text-ink-50">
                    {user.name ?? "用户"}
                  </p>
                  <p className="text-[11px] leading-tight text-ink-500 dark:text-ink-400">
                    {user.phone}
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
              const active = pathname === item.href;
              const Icon = item.icon;
              if (item.placeholder) {
                return (
                  <span
                    key={item.label}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-ink-300 dark:text-ink-600"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </span>
                );
              }
              return (
                <Link
                  key={item.label}
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
