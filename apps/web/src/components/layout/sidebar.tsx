"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderGit2,
  Server,
  Settings,
  Boxes,
} from "lucide-react";

import { APP_CONFIG } from "@lynxkit/shared";

import { cn } from "@/lib/utils";

// 控制台侧边栏导航项
const NAV_ITEMS = [
  { href: "/console", label: "概览", icon: LayoutDashboard },
  { href: "/console/projects", label: "项目", icon: FolderGit2 },
  { href: "/console/servers", label: "服务器", icon: Server },
  { href: "/console/settings", label: "设置", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-zinc-200 bg-white md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-zinc-200 px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lynx-500 text-white">
            <Boxes className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold text-zinc-900">
            {APP_CONFIG.name}
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/console"
              ? pathname === "/console"
              : pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-lynx-50 text-lynx-700"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
