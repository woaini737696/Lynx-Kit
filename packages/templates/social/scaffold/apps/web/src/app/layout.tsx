import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

/**
 * 根 Layout
 * - 注入字体与全局主题色（{{THEME_COLOR}} 由 9 层 Agent 替换，默认 #FF6B35 暖橙）
 * - 主题色通过 CSS 变量注入，供 shadcn/ui 与 Tailwind 共享
 */
export const metadata: Metadata = {
  title: {
    default: "{{APP_NAME}}",
    template: `%s | {{APP_NAME}}`,
  },
  description: "AI 社交产品 — 智能匹配、实时聊天、AI 破冰助手",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body
        className="min-h-screen bg-gray-50 text-gray-900 antialiased"
        style={{ "--theme": "{{THEME_COLOR}}" } as React.CSSProperties}
      >
        {children}
      </body>
    </html>
  );
}
