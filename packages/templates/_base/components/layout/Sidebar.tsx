import * as React from "react";

import type { NavItem } from "./AppShell";

/**
 * 侧边栏（管理后台用）
 * - 桌面端固定左侧
 * - 含分组与展开/折叠
 */

export interface SidebarProps {
  items: NavItem[];
  groups?: { title?: string; items: NavItem[] }[];
  activeKey?: string;
  onNavigate?: (item: NavItem) => void;
}

export function Sidebar({
  items,
  groups,
  activeKey,
  onNavigate,
}: SidebarProps) {
  const renderItem = (item: NavItem) => {
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
          "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm",
          active
            ? "bg-blue-50 text-blue-700"
            : "text-gray-700 hover:bg-gray-100",
        ].join(" ")}
      >
        {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
        <span className="flex-1 text-left">{item.label}</span>
        {item.badge && <span>{item.badge}</span>}
      </button>
    );
  };

  return (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {items.map(renderItem)}
      {groups?.map((group, idx) => (
        <div key={idx} className="mt-4">
          {group.title && (
            <div className="px-3 pb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
              {group.title}
            </div>
          )}
          <div className="flex flex-col gap-1">{group.items.map(renderItem)}</div>
        </div>
      ))}
    </nav>
  );
}
