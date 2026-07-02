import type { NextConfig } from "next";

/**
 * Next.js 配置 - Electron 桌面端静态导出
 *
 * 桌面端通过 Next.js `output: 'export'` 产出纯静态站点，再由 Electron 主进程
 * 在生产环境下通过内置 http 服务（main.ts）托管 `out/` 目录加载渲染。
 * 这样可避免 file:// 协议下 `/_next/...` 绝对路径资源加载失败的问题。
 */
const nextConfig: NextConfig = {
  // 静态导出：构建产物输出到 out/ 目录
  output: "export",

  // 关闭图片优化（静态导出不支持服务端优化）
  images: {
    unoptimized: true,
  },

  // 转译 workspace 内的源码包，使其可被 Next 直接消费
  transpilePackages: [
    "@lynxkit/shared",
    "@lynxkit/ui-web",
    "@lynxkit/store",
    "@lynxkit/api-client",
  ],

  reactStrictMode: true,

  // 静态导出对尾部斜杠更友好，便于 file:// / 本地服务相对路径解析
  trailingSlash: true,
};

export default nextConfig;
