/**
 * LynxKit Mobile i18n 配置
 *
 * 基于 react-i18next，支持中英双语动态切换。
 *
 * - 默认语言：AsyncStorage 持久化 → expo-localization 系统语言 → 'zh'
 * - 资源：静态 import（避免异步加载的复杂度）
 * - 切换：通过 useTranslation 的 i18n.changeLanguage() 即时切换
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import zh from "./messages/zh.json";
import en from "./messages/en.json";

export const SUPPORTED_LANGUAGES = ["zh", "en"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<Language, string> = {
  zh: "中文",
  en: "English",
};

const STORAGE_KEY = "lynxkit:lang";

/**
 * 获取初始语言：AsyncStorage → 系统语言 → 'zh'
 */
async function getInitialLanguage(): Promise<Language> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.includes(stored as Language)) {
      return stored as Language;
    }
  } catch {
    // AsyncStorage 读取失败，降级到系统语言
  }

  // expo-localization 返回系统语言列表，如 ["zh-CN", "en-US"]
  const locales = Localization.getLocales();
  const systemLang = locales[0]?.languageCode ?? "zh";
  return SUPPORTED_LANGUAGES.includes(systemLang as Language)
    ? (systemLang as Language)
    : "zh";
}

/**
 * 切换语言并持久化
 */
export async function changeLanguage(lang: Language): Promise<void> {
  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem(STORAGE_KEY, lang);
}

/**
 * 初始化 i18n（异步，需在 App 启动时 await）
 */
export async function initI18n(): Promise<void> {
  const initialLang = await getInitialLanguage();

  await i18n.use(initReactI18next).init({
    resources: {
      zh: { translation: zh },
      en: { translation: en },
    },
    lng: initialLang,
    fallbackLng: "zh",
    supportedLngs: [...SUPPORTED_LANGUAGES],
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });
}

export default i18n;
