import type { Metadata } from "next";

/**
 * LynxKit Web SEO 元数据生成
 *
 * 统一所有营销页 / 商店页 / 详情页的 OpenGraph + Twitter Card 配置，
 * 确保搜索引擎和社交平台抓取一致。
 */

const SITE_URL = process.env.NEXT_PUBLIC_WEB_URL ?? "https://lynxkit.com";
const SITE_NAME = "LynxKit";
const DEFAULT_OG_IMAGE = "/og.png";

export const siteConfig = {
  name: SITE_NAME,
  url: SITE_URL,
  description:
    "LynxKit 是 AI 时代的超级个体造物平台 —— 描述你的想法，AI 帮你从架构到代码再到部署一站完成。",
  ogImage: DEFAULT_OG_IMAGE,
};

interface CreateMetadataInput {
  title: string;
  description: string;
  image?: string;
  path?: string;
  type?: "website" | "article" | "product";
  publishedTime?: string;
  noIndex?: boolean;
}

export function createMetadata({
  title,
  description,
  image,
  path,
  type = "website",
  publishedTime,
  noIndex = false,
}: CreateMetadataInput): Metadata {
  const url = path ? `${SITE_URL}${path}` : SITE_URL;
  const ogImage = image ?? DEFAULT_OG_IMAGE;
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      type: type === "website" ? "website" : "article",
      ...(publishedTime ? { publishedTime } : {}),
      locale: "zh_CN",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

/** 站点根元数据 */
export const rootMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - AI 时代，人人都是造物主`,
    template: `%s | ${SITE_NAME}`,
  },
  description: siteConfig.description,
  keywords: [
    "LynxKit",
    "AI 构建",
    "AI 造物",
    "无代码",
    "AI 应用",
    "超级个体",
    "AI Agent",
    "AI 创业",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - AI 时代，人人都是造物主`,
    description: siteConfig.description,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - AI 时代，人人都是造物主`,
    description: siteConfig.description,
    images: [DEFAULT_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};
