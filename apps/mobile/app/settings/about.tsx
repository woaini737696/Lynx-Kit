import { Pressable, ScrollView, Text, View, Linking } from 'react-native';
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

  return (
    <ScrollView className="flex-1 bg-slate-950" contentContainerClassName="px-4 py-4 gap-4">
      <View className="flex-row items-center gap-2">
        <Info size={22} color="#FF6B35" />
        <Text className="text-xl font-bold text-white">{t('about.title')}</Text>
      </View>

      <View className="gap-3 rounded-2xl bg-slate-800 p-4">
        <View className="flex-row items-center justify-between">
          <View className="gap-1">
            <Text className="text-lg font-bold text-white">妙想</Text>
            <Text className="text-xs text-slate-400">{t('about.tagline')}</Text>
          </View>
          <View className="rounded-full bg-lynx-500/20 px-3 py-1">
            <Text className="text-sm font-semibold text-lynx-500">v{APP_VERSION}</Text>
          </View>
        </View>
        <Text className="text-sm leading-5 text-slate-400">
          {t('about.description')}
        </Text>
        <Pressable
          onPress={() => Linking.openURL(UPDATE_URL)}
          className="flex-row items-center justify-center gap-2 rounded-xl bg-slate-700 py-3 active:opacity-80"
        >
          <ExternalLink size={16} color="#F8FAFC" />
          <Text className="text-sm font-medium text-white">{t('about.checkUpdate')}</Text>
        </Pressable>
      </View>

      <View className="gap-3 rounded-2xl bg-slate-800 p-4">
        <Text className="text-sm font-semibold text-slate-200">{t('about.techStack')}</Text>
        {TECH_STACK.map((tech) => (
          <View key={tech.categoryKey} className="gap-1.5">
            <Text className="text-xs font-medium text-slate-400">{t(tech.categoryKey)}</Text>
            <View className="flex-row flex-wrap gap-1.5">
              {tech.items.map((item) => (
                <View key={item} className="rounded-full bg-slate-700 px-2.5 py-1">
                  <Text className="text-xs text-slate-300">{item}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
