import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "sw.js",
  // 开发环境禁用 Service Worker，避免缓存干扰调试
  disable: process.env.NODE_ENV === "development",
  cacheOnNavigation: true,
  reloadOnOnline: true,
});

const nextConfig: NextConfig = {
  // 转译 workspace 内的源码包，使其可被 Next 直接消费
  transpilePackages: ["@lynxkit/shared"],
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
  reactStrictMode: true,
};

export default withSerwist(nextConfig);
