import {
  createApiClient,
  AuthApi,
  BuildApi,
  AgentApi,
  StoreApi,
  CreatorApi,
  AiApi,
  ApiError,
  type ApiClient,
} from "@lynxkit/api-client";
import { toast } from "@lynxkit/ui-web";
import { useAuthStore } from "@lynxkit/store";

/**
 * api-client 单例
 *
 * 桌面端通过 @lynxkit/api-client 调用 LynxKit Hono API（默认线上 https://miaox.lynxdo.com/api）。
 * JWT 从 @lynxkit/store 的 auth-store 读取并注入 Authorization 头。
 * 后端地址可通过 VITE_API_URL 环境变量覆盖（开发时本地启动 API 用 http://localhost:8787/api）。
 */

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL ?? "https://miaox.lynxdo.com/api";

let client: ApiClient | null = null;

function getClient(): ApiClient {
  if (client) return client;
  client = createApiClient({
    baseUrl: API_BASE_URL,
    getToken: () => useAuthStore.getState().token,
    onError: (error: ApiError) => {
      // 401 处理：
      // - 若本地仍有 token，说明 token 已过期 → 清空登录态并提示
      // - 若本地无 token，说明只是未登录访问受保护资源（如 /auth/me 探测）→ 静默
      if (error.status === 401) {
        if (useAuthStore.getState().token) {
          useAuthStore.getState().logout();
          toast({ title: "登录已过期，请重新登录", variant: "destructive" });
        }
        return;
      }
      // 其它错误统一提示（调用方仍可自行 catch）
      if (error.status >= 500) {
        toast({ title: "服务异常", description: error.message, variant: "destructive" });
      }
    },
  });
  return client;
}

/** 认证 API（登录 / 注册 / 当前用户 / 验证码） */
export const authApi = new AuthApi(getClient());

/** 构建会话 API（创建 / 配置 / 启动 / 日志 / 流式） */
export const buildApi = new BuildApi(getClient());

/** Agent 流式 API（启动 / 取消 / 状态 / SSE） */
export const agentApi = new AgentApi(getClient());

/** 商店 API（列表 / 详情 / 交易 / 评价） */
export const storeApi = new StoreApi(getClient());

/** 创作者 API（档案 / 收益 / 提现 / 产品管理） */
export const creatorApi = new CreatorApi(getClient());

/** AI 模型配置 API（增删改查 / 连通性测试 / 设为默认） */
export const aiApi = new AiApi(getClient());

export { getClient, ApiError, API_BASE_URL };
