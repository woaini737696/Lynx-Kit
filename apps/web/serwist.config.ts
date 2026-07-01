import type { RuntimeCaching } from "serwist";

// 运行时缓存策略：图片走 CacheFirst，其余 GET 走 StaleWhileRevalidate
const runtimeCaching: RuntimeCaching[] = [
  {
    matcher: ({ request }) => request.destination === "image",
    handler: "CacheFirst",
    options: {
      cacheName: "lynxkit-images",
      expiration: {
        maxEntries: 60,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 天
      },
    },
  },
  {
    matcher: ({ request }) =>
      request.method === "GET" && request.destination === "style",
    handler: "StaleWhileRevalidate",
    options: {
      cacheName: "lynxkit-styles",
    },
  },
  {
    matcher: ({ request }) => request.method === "GET",
    handler: "StaleWhileRevalidate",
    options: {
      cacheName: "lynxkit-others",
    },
  },
];

const serwistConfig = {
  globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
  globDirectory: [".next/static", "public"],
  disableInDevelopmentMode: true,
  runtimeCaching,
};

export default serwistConfig;
