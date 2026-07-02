import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "LynxKit - AI 产品构建器",
  description: "描述你的想法，AI 帮你实现。灵感输入 → 架构匹配 → 澄清 → 预览 → 部署。",
  applicationName: "LynxKit",
  authors: [{ name: "LynxKit" }],
  keywords: ["AI", "LynxKit", "无代码", "AI 构建", "桌面端"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FF6B35",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
