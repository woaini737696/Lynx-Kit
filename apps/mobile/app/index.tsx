import { Redirect } from 'expo-router';
import { useAuthStore } from '@lynxkit/store';

/**
 * 入口路由 —— 已登录重定向到 (tabs)/home，未登录重定向到 (auth)/login。
 */
export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return <Redirect href={isAuthenticated ? '/(tabs)/home' : '/(auth)/login'} />;
}
