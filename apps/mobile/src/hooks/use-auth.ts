import { useCallback } from 'react';
import { useAuthStore } from '@lynxkit/store';
import * as Haptics from 'expo-haptics';
import { authApi } from '../lib/api';
import { setAuthToken, clearAuthToken, hydrateToken } from '../lib/storage';

/**
 * 认证 Hook —— 桥接 @lynxkit/store 的 authStore 与 api-client。
 *
 * token 同步落盘到 expo-secure-store，并通过内存缓存供 api-client 同步读取。
 *
 * 登录方式：
 *   - 手机号 + 密码   login(phone, password)
 *   - 手机号 + 验证码  loginByCode(phone, code)
 */
export function useAuth() {
  const { user, token, isAuthenticated, setUser, logout, updateProfile } =
    useAuthStore();

  /** 应用启动时从 SecureStore 预热 token 缓存 */
  const hydrate = useCallback(async () => {
    await hydrateToken();
  }, []);

  /** 手机号 + 密码 登录 */
  const login = useCallback(
    async (phone: string, password: string) => {
      const { user: u, accessToken: t } = await authApi.login(phone, password);
      await setAuthToken(t);
      setUser(u, t);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return u;
    },
    [setUser],
  );

  /** 手机号 + 验证码 登录 */
  const loginByCode = useCallback(
    async (phone: string, code: string) => {
      const { user: u, accessToken: t } = await authApi.loginByCode(phone, code);
      await setAuthToken(t);
      setUser(u, t);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return u;
    },
    [setUser],
  );

  /** 手机号 + 验证码 注册 */
  const register = useCallback(
    async (input: {
      phone: string;
      code: string;
      password: string;
      name: string;
    }) => {
      const { user: u, accessToken: t } = await authApi.register(input);
      await setAuthToken(t);
      setUser(u, t);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return u;
    },
    [setUser],
  );

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // 忽略登出网络错误，本地清掉即可
    }
    await clearAuthToken();
    logout();
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [logout]);

  return {
    user,
    token,
    isAuthenticated,
    hydrate,
    login,
    loginByCode,
    register,
    signOut,
    updateProfile,
  };
}
