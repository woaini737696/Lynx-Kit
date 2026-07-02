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
 * Web 端通过 @lynxkit/api-client 调用 LynxKit Hono API（默认 http://localhost:4000）。
 * JWT 从 @lynxkit/store 的 auth-store 读取并注入 Authorization 头。
 * 后端地址可通过 NEXT_PUBLIC_API_URL 环境变量覆盖。
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787/api";

let client: ApiClient | null = null;

function getClient(): ApiClient {
  if (client) return client;
  client = createApiClient({
    baseUrl: API_BASE_URL,
    getToken: () => useAuthStore.getState().token,
    onError: (error: ApiError) => {
      // 401 → 清空登录态，提示重新登录
      if (error.status === 401) {
        useAuthStore.getState().logout();
        toast({ title: "登录已过期，请重新登录", variant: "destructive" });
        return;
      }
      // 其它错误统一提示（调用方仍可自行 catch）
      if (error.status >= 500) {
        toast({
          title: "服务异常",
          description: error.message,
          variant: "destructive",
        });
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
