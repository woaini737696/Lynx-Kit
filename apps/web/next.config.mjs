import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

/** @type {import("next").NextConfig} */
const nextConfig = {
  // 转译 workspace 内的源码包，使其可被 Next 直接消费
  transpilePackages: [
    "@lynxkit/shared",
    "@lynxkit/ui-web",
    "@lynxkit/store",
    "@lynxkit/api-client",
  ],
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "miaox.lynxdo.com"],
    },
  },
  reactStrictMode: true,
};

export default withNextIntl(nextConfig);
