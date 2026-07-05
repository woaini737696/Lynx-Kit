/** @type {import("next").NextConfig} */
const nextConfig = {
  // 转译 workspace 内的源码包
  transpilePackages: ["@lynxkit/shared", "@lynxkit/ui-web", "@lynxkit/api-client"],
  reactStrictMode: true,
  // 静态导出：所有页面均为 "use client"，可直接由 Nginx 静态托管
  // 避免 pnpm Windows 符号链接在 Linux 上失效的问题
  output: "export",
  // 静态导出需要禁用服务端图片优化（运营后台使用静态资源 URL）
  images: { unoptimized: true },
  // 运营后台通过环境变量指向 API
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "https://miaox.lynxdo.com/api",
    NEXT_PUBLIC_ADMIN_NAME: "妙想运营后台",
  },
};

export default nextConfig;
