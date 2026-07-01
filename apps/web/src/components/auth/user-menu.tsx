"use client";

import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setToken } from "@/lib/api-client";

// 读取本地缓存的用户信息（登录时写入）
function getCachedUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("lynxkit_user");
    return raw ? (JSON.parse(raw) as { name?: string; email: string }) : null;
  } catch {
    return null;
  }
}

export function UserMenu() {
  const router = useRouter();
  const user = getCachedUser();
  const initial = (user?.name ?? user?.email ?? "U")[0]?.toUpperCase() ?? "U";

  const handleLogout = () => {
    setToken(null);
    window.localStorage.removeItem("lynxkit_user");
    router.push("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full border border-zinc-200 p-1 pr-3 transition-colors hover:bg-zinc-50">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lynx-500 text-sm font-semibold text-white">
            {initial}
          </span>
          <span className="hidden text-sm font-medium text-zinc-700 sm:inline">
            {user?.name ?? "用户"}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="text-sm font-medium">{user?.name ?? "未命名"}</span>
          <span className="text-xs font-normal text-zinc-500">
            {user?.email ?? ""}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/console/settings")}>
          <UserIcon className="mr-2 h-4 w-4" />
          个人设置
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:bg-red-50 focus:text-red-700"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
