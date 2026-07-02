import { getRequestConfig } from "next-intl/server";

/**
 * next-intl 服务端配置（无 i18n 路由版）
 *
 * LynxKit Web 采用单 locale（zh-CN）作为站点语言，不在 URL 中带 locale 段，
 * messages 仍然按 zh / en 维护，便于后续扩展多语言。
 */

export const locales = ["zh", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "zh";

export default getRequestConfig(async () => {
  const locale = defaultLocale;
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
