import { Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const { user, signOut } = useAuth();
  const emphasisIcon = isDark ? '#09090B' : '#FFFFFF';

  const menuItems = [
    {
      label: t('profile.myBuilds'),
      icon: Hammer,
      onPress: () => router.push('/(tabs)/build'),
    },
    {
      label: t('profile.myPurchases'),
      icon: ShoppingBag,
      onPress: () => router.push('/(tabs)/store'),
    },
    {
      label: t('profile.creatorCenter'),
      icon: PenTool,
      onPress: () => router.push('/creator/index'),
    },
    {
      label: t('profile.settings'),
      icon: Settings,
      onPress: () => router.push('/settings/index'),
    },
  ];

  return (
    <ScrollView className="flex-1 bg-ink-100 dark:bg-ink-950">
      <View
        style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
        className="px-4 gap-4"
      >
        {/* 用户信息卡片（毛玻璃 + 头像） */}
        <View className="items-center gap-3 rounded-3xl border border-white/70 bg-white/70 p-6 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-900/70">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-ink-950 dark:bg-ink-100">
            <Text className="text-3xl font-semibold text-ink-0 dark:text-ink-950">
              {(user?.name ?? user?.email ?? 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View className="items-center gap-1">
            <Text className="text-xl font-semibold text-ink-900 dark:text-ink-50">
              {user?.name ?? t('profile.unnamed')}
            </Text>
            <Text className="text-sm text-ink-500 dark:text-ink-400">
              {user?.email}
            </Text>
          </View>
        </View>

        {/* 设置列表：毛玻璃卡片，每项带图标 + 文字 + 箭头 */}
        <View className="gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Pressable
                key={item.label}
                onPress={item.onPress}
                className="flex-row items-center gap-3 rounded-2xl border border-white/70 bg-white/70 px-4 py-4 backdrop-blur-xl active:opacity-80 dark:border-ink-800/60 dark:bg-ink-900/70"
              >
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-ink-950 dark:bg-ink-100">
                  <Icon size={18} color={emphasisIcon} />
                </View>
                <Text className="flex-1 text-base text-ink-900 dark:text-ink-50">
                  {item.label}
                </Text>
                <ChevronRight size={18} color="#A1A1AA" />
              </Pressable>
            );
          })}
        </View>

        {/* 退出登录按钮：纯黑 */}
        <Pressable
          onPress={signOut}
          className="mt-2 flex-row items-center justify-center gap-2 rounded-full bg-ink-950 px-4 py-4 active:opacity-80 dark:bg-ink-100"
        >
          <LogOut size={18} color={emphasisIcon} />
          <Text className="text-base font-semibold text-ink-0 dark:text-ink-950">
            {t('profile.logout')}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
