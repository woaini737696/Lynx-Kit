import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { config } from "@/config";

import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

/**
 * 根 Layout
 * - 注入字体与全局 CSS
 * - 通过 config 动态生成 SEO metadata
 */
export const metadata: Metadata = {
  title: {
    default: config.heroTitle || config.serviceName,
    template: `%s | ${config.serviceName}`,
  },
  description: config.heroSubtitle,
  keywords: [config.serviceName, config.heroSubtitle],
  openGraph: {
    title: config.heroTitle,
    description: config.heroSubtitle,
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
