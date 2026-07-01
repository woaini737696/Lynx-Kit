"use client";

import { UserMenu } from "@/components/auth/user-menu";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/80 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-zinc-500">控制台</span>
      </div>
      <UserMenu />
    </header>
  );
}
