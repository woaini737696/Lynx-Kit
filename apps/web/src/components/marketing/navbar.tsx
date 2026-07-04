"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sparkles, Download } from "lucide-react";
import { Button } from "@lynxkit/ui-web";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/#features", label: "功能" },
  { href: "/#product-types", label: "产品类型" },
  { href: "/#pricing", label: "定价" },
  { href: "/store", label: "商店" },
  { href: "/blog", label: "博客" },
  { href: "/about", label: "关于" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-300",
        scrolled
          ? "border-ink-200/60 bg-white/55 backdrop-blur-xl backdrop-saturate-150"
          : "border-transparent bg-transparent",
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand - 黑色方块 logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-950 shadow-sm dark:bg-ink-100">
            <Sparkles className="h-4 w-4 text-white dark:text-ink-950" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-ink-900 dark:text-ink-50">
            妙想
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-ink-500 transition-colors hover:bg-white/60 hover:text-ink-900 dark:hover:bg-white/10 dark:hover:text-ink-50"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost" size="sm">
            <a
              href="https://miaox.lynxdo.com/lynxkit/LynxKit-Setup-0.1.0-x64.exe"
              download
              className="text-ink-500 hover:text-ink-900"
            >
              <Download className="h-4 w-4" />
              下载桌面版
            </a>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/login" className="text-ink-600 hover:text-ink-950">
              登录
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="rounded-full bg-ink-950 px-4 text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)] hover:bg-ink-800 dark:bg-ink-100 dark:text-ink-950 dark:hover:bg-ink-200"
          >
            <Link href="/register">免费开始</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-900 md:hidden dark:text-ink-50"
          onClick={() => setOpen((v) => !v)}
          aria-label="切换菜单"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile nav - 毛玻璃下拉 */}
      {open ? (
        <div className="border-t border-ink-200/60 bg-white/85 backdrop-blur-xl backdrop-saturate-150 md:hidden">
          <nav className="container mx-auto flex flex-col gap-1 px-4 py-4 sm:px-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <Button asChild variant="outline" size="sm">
                <a
                  href="https://miaox.lynxdo.com/lynxkit/LynxKit-Setup-0.1.0-x64.exe"
                  download
                >
                  <Download className="h-4 w-4" />
                  下载桌面版
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/login">登录</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="rounded-full bg-ink-950 text-white dark:bg-ink-100 dark:text-ink-950"
              >
                <Link href="/register">免费开始</Link>
              </Button>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
