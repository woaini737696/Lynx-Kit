import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'lynxkit-token';

/**
 * 内存级 token 缓存。
 *
 * @lynxkit/api-client 的 getToken 期望同步返回 string | null，
 * 而 expo-secure-store 的读取是异步的。这里通过内存缓存提供同步访问，
 * 由 App 启动时调用 hydrateToken() 预热、登录/登出时同步更新。
 */
let tokenCache: string | null = null;

/** 应用启动时预热 token 缓存 */
export async function hydrateToken(): Promise<void> {
  tokenCache = await SecureStore.getItemAsync(TOKEN_KEY);
}

/** 同步读取 token（供 api-client 的 getToken 使用） */
export function getAuthTokenSync(): string | null {
  return tokenCache;
}

export async function setAuthToken(token: string): Promise<void> {
  tokenCache = token;
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearAuthToken(): Promise<void> {
  tokenCache = null;
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getSecureItem(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

export async function deleteSecureItem(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}
