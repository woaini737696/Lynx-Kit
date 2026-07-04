import { Link, Stack } from 'expo-router';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { Home } from 'lucide-react-native';

export default function NotFoundScreen() {
  const isDark = useColorScheme() === 'dark';
  const emphasisIcon = isDark ? '#09090B' : '#FFFFFF';
  const headerBg = isDark ? '#18181B' : '#F5F5F7';
  const headerTint = isDark ? '#FAFAFA' : '#09090B';

  return (
    <>
      <Stack.Screen
        options={{
          title: '找不到页面',
          headerShown: true,
          headerTintColor: headerTint,
          headerStyle: { backgroundColor: headerBg },
          headerShadowVisible: false,
        }}
      />
      <View className="flex-1 items-center justify-center gap-4 bg-ink-100 px-8 dark:bg-ink-950">
        <Text className="text-6xl font-bold text-ink-300 dark:text-ink-800">
          404
        </Text>
        <Text className="text-base text-ink-500 dark:text-ink-400">
          页面不存在
        </Text>
        <Link href="/(tabs)/home" asChild>
          <Pressable className="flex-row items-center gap-2 rounded-full bg-ink-950 px-5 py-2.5 active:opacity-80 dark:bg-ink-100">
            <Home size={16} color={emphasisIcon} />
            <Text className="text-sm font-semibold text-ink-0 dark:text-ink-950">
              返回首页
            </Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}
