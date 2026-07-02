import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";

/**
 * SEO robots.txt
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // 后台、API、认证相关禁止索引
      disallow: ["/admin/", "/api/", "/admin"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
