import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@lynxkit/store';
import { hydrateToken } from '../src/lib/storage';
import { usePushNotifications } from '../src/hooks/use-push-notifications';
import { ErrorBoundary } from '../src/components/error-boundary';
import { initI18n } from '../src/i18n';
import '@/i18n';

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
  const isDark = colorScheme === 'dark';
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { t } = useTranslation();
  usePushNotifications(isAuthenticated);

  // DESIGN_SYSTEM.md：极简 Header（ink 配色，明暗自适应）
  const headerOptions = (title: string) => ({
    title,
    headerShown: true as const,
    headerShadowVisible: false,
    headerTintColor: isDark ? '#F5F5F7' : '#09090B',
    headerStyle: {
      backgroundColor: isDark ? '#18181B' : '#F5F5F7',
    },
    headerTitleStyle: {
      fontWeight: '600' as const,
      color: isDark ? '#F5F5F7' : '#09090B',
    },
  });

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: isDark ? '#09090B' : '#F5F5F7',
        },
        // 状态栏文字随系统主题切换
        statusBarStyle: isDark ? 'light' : 'dark',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="build/[sessionId]"
        options={headerOptions(t('build.progressTitle'))}
      />
      <Stack.Screen
        name="build/[sessionId]/configure"
        options={headerOptions(t('build.configureTitle'))}
      />
      <Stack.Screen
        name="build/[sessionId]/code"
        options={headerOptions(t('build.codePreview'))}
      />
      <Stack.Screen
        name="build/[sessionId]/deploy"
        options={headerOptions(t('build.deployTitle'))}
      />
      <Stack.Screen
        name="build/preview"
        options={headerOptions(t('build.preview'))}
      />
      <Stack.Screen
        name="store/[productId]"
        options={headerOptions(t('store.productDetail'))}
      />
      <Stack.Screen
        name="creator/index"
        options={headerOptions(t('creator.title'))}
      />
      <Stack.Screen
        name="creator/products"
        options={headerOptions(t('creator.products'))}
      />
      <Stack.Screen
        name="settings/index"
        options={headerOptions(t('settings.title'))}
      />
      <Stack.Screen
        name="settings/ai-models"
        options={headerOptions(t('settings.aiModels'))}
      />
      <Stack.Screen
        name="settings/profile"
        options={headerOptions(t('settings.profile'))}
      />
      <Stack.Screen
        name="settings/notifications"
        options={headerOptions(t('settings.notifications'))}
      />
      <Stack.Screen
        name="settings/about"
        options={headerOptions(t('about.title'))}
      />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await initI18n();
      await hydrateToken();
      setReady(true);
      await SplashScreen.hideAsync().catch(() => {});
    })();
  }, []);

  if (!ready) {
    // splash 仍在显示，渲染空壳避免闪烁
    return null;
  }

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <RootStack />
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
