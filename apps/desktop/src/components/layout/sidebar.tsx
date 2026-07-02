import { Link, useLocation } from "react-router-dom";
import {
  Sparkles,
  LayoutGrid,
  Store,
  UserSquare,
  Settings,
  Github,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@lynxkit/store";

/**
 * 侧边导航栏
 *
 * 主导航：构建 / 商店 / 创作者 / 设置。
 * 可折叠（受 ui-store.sidebarOpen 控制）。
 */
const NAV = [
  { href: "/build", label: "构建", icon: LayoutGrid },
  { href: "/store", label: "商店", icon: Store },
  { href: "/creator", label: "创作者", icon: UserSquare },
  { href: "/settings", label: "设置", icon: Settings },
] as const;

export function Sidebar() {
  const { pathname } = useLocation();
  const open = useUIStore((s) => s.sidebarOpen);

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-card/40 transition-[width] duration-200",
        open ? "w-60" : "w-0 overflow-hidden",
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b border-border px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lynx-500 text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <span className="text-lg font-bold tracking-tight">LynxKit</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
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

      <div className="border-t border-border p-3">
        <a
          href="https://github.com/lynxkit"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <Github className="h-4 w-4" />
          GitHub
        </a>
      </div>
    </aside>
  );
}
