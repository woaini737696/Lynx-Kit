/**
 * LynxKit Desktop i18n 配置
 *
 * 基于 react-i18next，支持中英双语动态切换。
 *
 * - 默认语言：localStorage 持久化 → navigator.language → 'zh'
 * - 资源：静态 import（Electron 应用对包体积不敏感，避免异步加载的复杂度）
 * - 切换：通过 useTranslation 的 i18n.changeLanguage() 即时切换
 */

import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import zh from "./messages/zh.json";
import en from "./messages/en.json";

export const SUPPORTED_LANGUAGES = ["zh", "en"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<Language, string> = {
  zh: "中文",
  en: "English",
};

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      zh: { translation: zh },
      en: { translation: en },
    },
    fallbackLng: "zh",
    supportedLngs: [...SUPPORTED_LANGUAGES],
    interpolation: {
      // React 已转义，避免双重转义
      escapeValue: false,
    },
    detection: {
      // 持久化到 localStorage，下次启动沿用用户偏好
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "lynxkit:lang",
      caches: ["localStorage"],
    },
    returnNull: false,
  });

export default i18n;
