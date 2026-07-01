import * as React from "react";

import type { NavItem } from "./AppShell";

/**
 * 底部导航（移动端用）
 * - 固定在屏幕底部
 * - 最多展示 5 项
 */

export interface BottomNavProps {
  items: NavItem[];
  activeKey?: string;
  onNavigate?: (item: NavItem) => void;
}

export function BottomNav({ items, activeKey, onNavigate }: BottomNavProps) {
  const display = items.slice(0, 5);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white md:hidden">
      <div className="grid grid-cols-5">
        {display.map((item) => {
          const active = activeKey === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                onNavigate?.(item);
                item.onClick?.();
              }}
              className={[
                "flex flex-col items-center justify-center gap-0.5 py-2 text-xs",
                active ? "text-blue-600" : "text-gray-500",
              ].join(" ")}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="max-w-full truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
