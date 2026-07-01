import * as React from "react";

import { Header } from "./Header";
import { Footer } from "./Footer";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";

/**
 * 应用外壳布局
 * - 桌面端：顶部 Header + 左侧 Sidebar（可选）+ 内容区 + 底部 Footer
 * - 移动端：顶部 Header + 内容区 + 底部 BottomNav
 */

export interface AppShellProps {
  children: React.ReactNode;
  /** 桌面端左侧导航项（管理后台用） */
  sidebarItems?: NavItem[];
  /** 底部导航项（移动端用） */
  bottomNavItems?: NavItem[];
  /** 顶部导航菜单项 */
  headerNav?: NavItem[];
  /** Logo 区域内容 */
  brand?: React.ReactNode;
  /** 是否展示页脚 */
  showFooter?: boolean;
  /** 用户菜单内容（右上角下拉） */
  userMenu?: React.ReactNode;
}

export interface NavItem {
  key: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  badge?: React.ReactNode;
}

export function AppShell({
  children,
  sidebarItems = [],
  bottomNavItems = [],
  headerNav = [],
  brand,
  showFooter = true,
  userMenu,
}: AppShellProps) {
  const hasSidebar = sidebarItems.length > 0;
  const hasBottomNav = bottomNavItems.length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header
        brand={brand}
        nav={headerNav}
        userMenu={userMenu}
        showMobileNav={hasBottomNav}
      />
      <div className="flex flex-1">
        {hasSidebar && (
          <aside className="hidden w-60 flex-shrink-0 border-r border-gray-200 bg-white md:block">
            <Sidebar items={sidebarItems} />
          </aside>
        )}
        <main className="flex-1 px-4 py-6 pb-24 sm:px-6 sm:pb-6">
          {children}
        </main>
      </div>
      {showFooter && <Footer />}
      {hasBottomNav && <BottomNav items={bottomNavItems} />}
    </div>
  );
}
