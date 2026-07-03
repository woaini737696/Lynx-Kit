import { Pressable, ScrollView, Text, View } from 'react-native';
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
    <ScrollView className="flex-1 bg-slate-950" contentContainerClassName="px-4 py-4 gap-2">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Pressable
            key={item.label}
            onPress={item.onPress}
            className="flex-row items-center gap-3 rounded-2xl bg-slate-800 px-4 py-4 active:opacity-80"
          >
            <Icon size={20} color="#FF6B35" />
            <Text className="flex-1 text-base text-slate-100">{item.label}</Text>
            <ChevronRight size={18} color="#475569" />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
