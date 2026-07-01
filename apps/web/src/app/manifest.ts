import type { MetadataRoute } from "next";

// PWA manifest，图标路径占位（图片后续补充到 public/icons/）
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LynxKit",
    short_name: "LynxKit",
    description: "原生双端 AI 产品构建平台 - 人人都是超级个体",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#FF6B35",
    background_color: "#ffffff",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
}
