import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

const nextConfig: NextConfig = {
  // 转译 workspace 内的源码包，使其可被 Next 直接消费
  transpilePackages: [
    "@lynxkit/shared",
    "@lynxkit/ui-web",
    "@lynxkit/store",
    "@lynxkit/api-client",
  ],
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
  reactStrictMode: true,
};

export default withNextIntl(nextConfig);
