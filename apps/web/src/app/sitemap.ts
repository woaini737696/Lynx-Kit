import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";

/**
 * SEO sitemap
 * 列出所有营销页 + 商店公开页 + 博客入口
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url;
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/store`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/#features`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/#product-types`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/#pricing`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/features`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/register`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
  ];

  return staticRoutes;
}
