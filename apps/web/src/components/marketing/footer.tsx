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
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6">
          {/* Brand column */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-lynx-500 to-lynx-600">
                <Sparkles className="h-4 w-4 text-white" />
              </span>
              <span className="text-lg font-bold tracking-tight">LynxKit</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              AI 时代，人人都是造物主。从一句话到上线，只需一杯咖啡的时间。
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://github.com/lynxkit"
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com/lynxkit"
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="mailto:hello@lynxkit.com"
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Link groups */}
          {FOOTER_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold">{group.title}</h3>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} LynxKit. 保留所有权利。
          </p>
          <p className="text-xs text-muted-foreground">
            Made with <span className="text-lynx-500">♥</span> by super
            individuals.
          </p>
        </div>
      </div>
    </footer>
  );
}
