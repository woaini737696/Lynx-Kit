import {
  createApiClient,
  AuthApi,
  BuildApi,
  AgentApi,
  StoreApi,
  CreatorApi,
  AiApi,
} from '@lynxkit/api-client';
import { getAuthTokenSync } from './storage';

export const apiClient = createApiClient({
  baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787',
  getToken: () => getAuthTokenSync(),
});

export const authApi = new AuthApi(apiClient);
export const buildApi = new BuildApi(apiClient);
export const agentApi = new AgentApi(apiClient);
export const storeApi = new StoreApi(apiClient);
export const creatorApi = new CreatorApi(apiClient);
export const aiApi = new AiApi(apiClient);
