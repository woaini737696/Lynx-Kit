import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/hooks/use-auth';
import {
  Hammer,
  ShoppingBag,
  PenTool,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const menuItems = [
    {
      label: '我的构建',
      icon: Hammer,
      onPress: () => router.push('/(tabs)/build'),
    },
    {
      label: '我的购买',
      icon: ShoppingBag,
      onPress: () => router.push('/(tabs)/store'),
    },
    {
      label: '创作者中心',
      icon: PenTool,
      onPress: () => router.push('/creator/index'),
    },
    {
      label: '设置',
      icon: Settings,
      onPress: () => router.push('/settings/index'),
    },
  ];

  return (
    <ScrollView className="flex-1 bg-slate-950">
      <View className="items-center gap-3 px-4 pt-14 pb-8">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-lynx-500">
          <Text className="text-3xl font-bold text-white">
            {(user?.name ?? user?.email ?? 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View className="items-center gap-1">
          <Text className="text-xl font-bold text-white">
            {user?.name ?? '未设置昵称'}
          </Text>
          <Text className="text-sm text-slate-400">{user?.email}</Text>
        </View>
      </View>

      <View className="mx-4 gap-2">
        {menuItems.map((item) => {
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

        <Pressable
          onPress={signOut}
          className="mt-4 flex-row items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-4 active:opacity-80"
        >
          <LogOut size={18} color="#EF4444" />
          <Text className="text-base font-semibold text-red-400">退出登录</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
