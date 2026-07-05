import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "妙想运营后台",
  description: "妙想 AI 产品平台 - 运营管理系统",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">{children}</body>
    </html>
  );
}
