import Link from "next/link";
import { Sparkles, Github, Twitter, Mail } from "lucide-react";

const FOOTER_GROUPS = [
  {
    title: "产品",
    links: [
      { label: "功能", href: "/#features" },
      { label: "定价", href: "/#pricing" },
      { label: "商店", href: "/store" },
      { label: "博客", href: "/blog" },
    ],
  },
  {
    title: "资源",
    links: [
      { label: "文档", href: "/docs" },
      { label: "API 参考", href: "/docs/api" },
      { label: "示例", href: "/#examples" },
      { label: "更新日志", href: "/changelog" },
    ],
  },
  {
    title: "公司",
    links: [
      { label: "关于我们", href: "/about" },
      { label: "联系", href: "/contact" },
      { label: "招聘", href: "/careers" },
      { label: "媒体资源", href: "/press" },
    ],
  },
  {
    title: "法律",
    links: [
      { label: "隐私政策", href: "/privacy" },
      { label: "用户协议", href: "/terms" },
      { label: "Cookie 政策", href: "/cookies" },
      { label: "许可证", href: "/license" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-ink-200/60 bg-ink-50/30 dark:border-ink-800/60 dark:bg-ink-950/30">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6">
          {/* Brand column */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-950 shadow-sm dark:bg-ink-100">
                <Sparkles className="h-4 w-4 text-white dark:text-ink-950" />
              </span>
              <span className="text-lg font-semibold tracking-tight text-ink-900 dark:text-ink-50">
                妙想
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-ink-500 dark:text-ink-400">
              AI 时代，人人都是造物主。从一句话到上线，只需一杯咖啡的时间。
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://github.com/lynxkit"
                target="_blank"
                rel="noreferrer"
                className="text-ink-400 transition-colors hover:text-ink-950 dark:hover:text-ink-50"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com/lynxkit"
                target="_blank"
                rel="noreferrer"
                className="text-ink-400 transition-colors hover:text-ink-950 dark:hover:text-ink-50"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="mailto:hello@lynxkit.com"
                className="text-ink-400 transition-colors hover:text-ink-950 dark:hover:text-ink-50"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Link groups */}
          {FOOTER_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-500 dark:text-ink-400">
                {group.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-600 transition-colors hover:text-ink-950 dark:text-ink-300 dark:hover:text-ink-50"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-ink-200/60 pt-6 sm:flex-row dark:border-ink-800/60">
          <p className="text-xs text-ink-500 dark:text-ink-400">
            © {new Date().getFullYear()} 妙想. 保留所有权利。
          </p>
          <p className="text-xs text-ink-500 dark:text-ink-400">
            Made by super individuals.
          </p>
        </div>
      </div>
    </footer>
  );
}
