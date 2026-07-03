import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  Cpu,
  User,
  Bell,
  Info,
  ChevronRight,
} from 'lucide-react-native';

export default function SettingsScreen() {
  const items = [
    {
      label: 'AI 模型配置',
      icon: Cpu,
      onPress: () => router.push('/settings/ai-models'),
    },
    {
      label: '个人资料',
      icon: User,
      onPress: () => router.push('/settings/profile'),
    },
    {
      label: '通知设置',
      icon: Bell,
      onPress: () => router.push('/settings/notifications'),
    },
    {
      label: '关于 LynxKit',
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
