import type { Metadata, Viewport } from "next";

import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "LynxKit - 人人都是超级个体",
  description:
    "LynxKit 是原生双端 AI 产品构建平台。不会代码，也能独立做产品——架构透明、模板优先、零运维。",
  manifest: "/manifest.webmanifest",
  applicationName: "LynxKit",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LynxKit",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF6B35",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-zinc-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
