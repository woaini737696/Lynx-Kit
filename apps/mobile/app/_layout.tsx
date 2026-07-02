import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack, useColorScheme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { useAuthStore } from '@lynxkit/store';
import { hydrateToken } from '../src/lib/storage';
import { usePushNotifications } from '../src/hooks/use-push-notifications';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* preventAutoHideAsync 在已隐藏时可能抛错，忽略 */
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function RootStack() {
  const colorScheme = useColorScheme();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  usePushNotifications(isAuthenticated);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0F172A' },
        // 暗色优先：状态栏文字浅色
        statusBarStyle: colorScheme === 'dark' ? 'light' : 'dark',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="build/[sessionId]"
        options={{ title: '构建进度', headerShown: true, headerTintColor: '#F8FAFC', headerStyle: { backgroundColor: '#0F172A' } }}
      />
      <Stack.Screen
        name="build/preview"
        options={{ title: '预览', headerShown: true, headerTintColor: '#F8FAFC', headerStyle: { backgroundColor: '#0F172A' } }}
      />
      <Stack.Screen
        name="store/[productId]"
        options={{ title: '产品详情', headerShown: true, headerTintColor: '#F8FAFC', headerStyle: { backgroundColor: '#0F172A' } }}
      />
      <Stack.Screen
        name="creator/index"
        options={{ title: '创作者中心', headerShown: true, headerTintColor: '#F8FAFC', headerStyle: { backgroundColor: '#0F172A' } }}
      />
      <Stack.Screen
        name="creator/products"
        options={{ title: '产品管理', headerShown: true, headerTintColor: '#F8FAFC', headerStyle: { backgroundColor: '#0F172A' } }}
      />
      <Stack.Screen
        name="settings/index"
        options={{ title: '设置', headerShown: true, headerTintColor: '#F8FAFC', headerStyle: { backgroundColor: '#0F172A' } }}
      />
      <Stack.Screen
        name="settings/ai-models"
        options={{ title: 'AI 模型配置', headerShown: true, headerTintColor: '#F8FAFC', headerStyle: { backgroundColor: '#0F172A' } }}
      />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await hydrateToken();
      setReady(true);
      await SplashScreen.hideAsync().catch(() => {});
    })();
  }, []);

  if (!ready) {
    // splash 仍在显示，渲染空壳避免闪烁
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <RootStack />
    </QueryClientProvider>
  );
}
