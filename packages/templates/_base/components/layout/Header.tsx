import * as React from "react";

import type { NavItem } from "./AppShell";

/**
 * 顶部导航
 * 响应式：桌面端横向菜单，移动端汉堡菜单
 */

export interface HeaderProps {
  brand?: React.ReactNode;
  nav?: NavItem[];
  userMenu?: React.ReactNode;
  showMobileNav?: boolean;
}

export function Header({ brand, nav = [], userMenu, showMobileNav = false }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center font-semibold text-gray-900">
            {brand ?? "LynxKit"}
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={item.onClick}
                className="rounded-md px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {userMenu}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-md p-2 text-gray-700 hover:bg-gray-100 md:hidden"
            aria-label="切换菜单"
            aria-expanded={mobileOpen}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-4 pb-3 pt-2 md:hidden">
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  item.onClick?.();
                  setMobileOpen(false);
                }}
                className="rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      )}
      {showMobileNav && <div className="h-14 md:hidden" aria-hidden="true" />}
    </header>
  );
}
