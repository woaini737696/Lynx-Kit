import {
  Pressable,
  ScrollView,
  Text,
  View,
  Linking,
  useColorScheme,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Info, ExternalLink } from 'lucide-react-native';

const APP_VERSION = '0.1.0';
const UPDATE_URL = 'http://47.119.185.135:8090/lynxkit/';

const TECH_STACK = [
  { categoryKey: 'about.categories.mobile', items: ['Expo SDK 52', 'React Native', 'TypeScript', 'NativeWind'] },
  { categoryKey: 'about.categories.desktop', items: ['Electron 30', 'Vite 5', 'React 19'] },
  { categoryKey: 'about.categories.backend', items: ['Hono', 'Node.js', 'PostgreSQL', 'Drizzle ORM'] },
  { categoryKey: 'about.categories.agent', items: ['9 层 Agent 流水线', 'AI SDK', 'SSE 流式'] },
];

export default function AboutScreen() {
  const { t } = useTranslation();
  const isDark = useColorScheme() === 'dark';
  const emphasisIcon = isDark ? '#09090B' : '#FFFFFF';

  return (
    <ScrollView
      className="flex-1 bg-ink-100 dark:bg-ink-950"
      contentContainerClassName="px-4 py-4 gap-4"
    >
      {/* 标题：纯黑圆形图标 */}
      <View className="flex-row items-center gap-3 pb-1">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-ink-950 dark:bg-ink-100">
          <Info size={18} color={emphasisIcon} />
        </View>
        <Text className="text-xl font-bold text-ink-900 dark:text-ink-50">
          {t('about.title')}
        </Text>
      </View>

      {/* 应用信息卡片（毛玻璃） */}
      <View className="gap-4 rounded-3xl border border-ink-200/60 bg-white/70 p-5 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-900/70">
        <View className="flex-row items-center justify-between">
          <View className="gap-1">
            <Text className="text-lg font-bold text-ink-900 dark:text-ink-50">
              妙想
            </Text>
            <Text className="text-xs text-ink-500 dark:text-ink-400">
              {t('about.tagline')}
            </Text>
          </View>
          <View className="rounded-full bg-ink-950 px-3 py-1 dark:bg-ink-100">
            <Text className="text-sm font-semibold text-ink-0 dark:text-ink-950">
              v{APP_VERSION}
            </Text>
          </View>
        </View>
        <Text className="text-sm leading-5 text-ink-600 dark:text-ink-300">
          {t('about.description')}
        </Text>
        <Pressable
          onPress={() => Linking.openURL(UPDATE_URL)}
          className="flex-row items-center justify-center gap-2 rounded-full bg-ink-950 py-3.5 active:opacity-80 dark:bg-ink-100"
        >
          <ExternalLink size={16} color={emphasisIcon} />
          <Text className="text-sm font-semibold text-ink-0 dark:text-ink-950">
            {t('about.checkUpdate')}
          </Text>
        </Pressable>
      </View>

      {/* 技术栈卡片（毛玻璃） */}
      <View className="gap-3 rounded-3xl border border-ink-200/60 bg-white/70 p-5 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-900/70">
        <Text className="text-sm font-semibold text-ink-900 dark:text-ink-50">
          {t('about.techStack')}
        </Text>
        {TECH_STACK.map((tech) => (
          <View key={tech.categoryKey} className="gap-2">
            <Text className="text-xs font-medium text-ink-500 dark:text-ink-400">
              {t(tech.categoryKey)}
            </Text>
            <View className="flex-row flex-wrap gap-1.5">
              {tech.items.map((item) => (
                <View
                  key={item}
                  className="rounded-full border border-ink-300 bg-transparent px-2.5 py-1 dark:border-ink-700"
                >
                  <Text className="text-xs text-ink-700 dark:text-ink-300">
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
