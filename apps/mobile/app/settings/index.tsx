import {
  Pressable,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Cpu,
  User,
  Bell,
  Info,
  ChevronRight,
} from 'lucide-react-native';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const isDark = useColorScheme() === 'dark';
  const emphasisIcon = isDark ? '#09090B' : '#FFFFFF';
  const subtleIcon = isDark ? '#A1A1AA' : '#71717A';

  const items = [
    {
      label: t('settings.aiModels'),
      icon: Cpu,
      onPress: () => router.push('/settings/ai-models'),
    },
    {
      label: t('settings.profile'),
      icon: User,
      onPress: () => router.push('/settings/profile'),
    },
    {
      label: t('settings.notifications'),
      icon: Bell,
      onPress: () => router.push('/settings/notifications'),
    },
    {
      label: t('settings.aboutLynxKit'),
      icon: Info,
      onPress: () => router.push('/settings/about'),
    },
  ];

  return (
    <ScrollView
      className="flex-1 bg-ink-100 dark:bg-ink-950"
      contentContainerClassName="px-4 py-4 gap-2"
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Pressable
            key={item.label}
            onPress={item.onPress}
            className="flex-row items-center gap-3 rounded-3xl border border-ink-200/60 bg-white/70 px-5 py-4 backdrop-blur-xl active:opacity-80 dark:border-ink-800/60 dark:bg-ink-900/70"
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-ink-950 dark:bg-ink-100">
              <Icon size={18} color={emphasisIcon} />
            </View>
            <Text className="flex-1 text-base font-medium text-ink-900 dark:text-ink-50">
              {item.label}
            </Text>
            <ChevronRight size={18} color={subtleIcon} />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
