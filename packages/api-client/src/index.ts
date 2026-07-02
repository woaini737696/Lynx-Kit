/**
 * @lynxkit/api-client - 跨端类型安全 API 客户端
 *
 * 为 LynxKit 三端（Desktop / Mobile / Web）提供统一的 Hono API 调用客户端。
 *
 * 特性：
 * - 跨端：仅依赖全局 fetch，不依赖 React，可在 Web / Electron / React Native 中使用
 * - 类型安全：可选 Zod schema 对响应做运行时校验，schema 全部来自 @lynxkit/shared
 * - 流式：通过 async generator 消费 SSE（用于 Agent 流式响应）
 * - 错误统一：所有非 2xx 响应抛出 ApiError
 *
 * 用法：
 * ```ts
 * import { createApiClient, AuthApi, BuildApi } from "@lynxkit/api-client";
 *
 * const client = createApiClient({
 *   baseUrl: "http://localhost:4000",
 *   getToken: () => localStorage.getItem("lynxkit_token"),
 * });
 *
 * const auth = new AuthApi(client);
 * const { user, token } = await auth.login("a@b.com", "password");
 *
 * const build = new BuildApi(client);
 * for await (const chunk of build.streamAgent(sessionId)) {
 *   console.log(chunk);
 * }
 * ```
 */

// 核心客户端
export { ApiClient, ApiError, createApiClient } from "./client.js";
export type { ApiClientOptions } from "./client.js";

// 客户端补充类型（实体类型请从 @lynxkit/shared 导入）
export type {
  LoginResponse,
  SendCodeResult,
  LogoutResult,
  CreateBuildInput,
  UpdateBuildConfigInput,
  StartBuildResult,
  AgentTaskStatus,
  StartAgentInput,
  AgentTask,
  AgentStreamEvent,
  ListStoreQuery,
  StoreListResult,
  PublishStoreProductInput,
  UpdateStoreProductInput,
  PublishResult,
  CreateTransactionInput,
  CreateReviewInput,
  CreatorStats,
  UpdateCreatorInput,
  WithdrawInput,
  UpsertAiModelInput,
  TestAiModelResult,
} from "./types.js";

// API 模块
export { AuthApi } from "./auth.js";
export type { SendCodeScene } from "./auth.js";

export { BuildApi } from "./build.js";

export { AgentApi } from "./agent.js";

export { StoreApi } from "./store.js";

export { CreatorApi } from "./creator.js";

export { AiApi } from "./ai.js";
