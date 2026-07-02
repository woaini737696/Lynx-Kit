/**
 * API 客户端补充类型
 *
 * 仅声明 @lynxkit/shared 未导出的响应 / 输入类型。
 * 实体类型（User / BuildSession / StoreProduct / CreatorProfile / AIModelConfig 等）
 * 全部从 @lynxkit/shared 导入，不在本文件重复定义。
 *
 * 约束：所有 Zod schema 均来自 @lynxkit/shared，本文件只定义 TS 接口。
 */

import type { AIProvider, ProductType } from "@lynxkit/shared";

// ============ 认证响应 ============

/** 登录 / 注册响应（含 JWT） */
export interface LoginResponse {
  /** 用户信息 */
  user: import("@lynxkit/shared").User;
  /** 访问令牌 */
  token: string;
  /** 刷新令牌（可选） */
  refreshToken?: string;
  /** 过期时间（秒） */
  expiresIn?: number;
}

/** 发送验证码响应 */
export interface SendCodeResult {
  sent: boolean;
  /** 冷却剩余秒数（限流时返回） */
  cooldown?: number;
}

/** 登出响应 */
export interface LogoutResult {
  ok: boolean;
}

// ============ 构建会话 ============

/** 创建构建会话输入（与 createBuildSchema 对应） */
export interface CreateBuildInput {
  /** 产品类型 */
  productType: ProductType;
  /** 用户原始需求描述（自然语言） */
  userInput: string;
  /** 是否跳过澄清直接进入开发 */
  skipClarify?: boolean;
}

/** 更新构建配置输入（与 updateConfigSchema 对应） */
export interface UpdateBuildConfigInput {
  /** 配置 patch（增量更新） */
  patch: Record<string, unknown>;
  /** 是否完成澄清，进入 ARCHITECTING */
  confirmClarify?: boolean;
}

/** 启动构建响应 */
export interface StartBuildResult {
  ok: boolean;
  /** 当前构建状态 */
  status?: import("@lynxkit/shared").BuildStatus;
}

// ============ Agent 任务 ============

/** Agent 任务状态 */
export type AgentTaskStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

/** 启动 Agent 任务输入（与 startAgentSchema 对应） */
export interface StartAgentInput {
  /** 所属会话 ID */
  sessionId: string;
  /** 要启动的 Agent 角色 */
  agent: import("@lynxkit/shared").AgentRole;
  /** 覆盖默认模型配置 */
  modelOverride?: {
    provider: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
  };
  /** 是否强制从该 Agent 重新开始 */
  forceRestart?: boolean;
}

/** Agent 任务句柄 */
export interface AgentTask {
  id: string;
  sessionId: string;
  status: AgentTaskStatus;
  /** 当前执行的 Agent 名称 */
  currentAgent?: string;
  createdAt: string;
  updatedAt: string;
}

/** SSE 事件负载（与 Agent 编排引擎输出对应） */
export interface AgentStreamEvent {
  /** 事件类型：log / token / done / error */
  type: "log" | "token" | "done" | "error";
  /** 产生事件的 Agent 名称 */
  agent?: string;
  /** 事件内容（token 文本 / 日志消息 / 错误描述） */
  data: string;
  /** 时间戳（ISO 8601） */
  timestamp?: string;
}

// ============ 商店 ============

/** 商店列表查询参数 */
export interface ListStoreQuery {
  /** 分类筛选 */
  category?: import("@lynxkit/shared").StoreCategory;
  /** 关键词搜索（匹配名称 / 描述 / 标签） */
  q?: string;
  /** 排序：newest / popular / rating */
  sort?: "newest" | "popular" | "rating";
  /** 分页页码，从 1 开始 */
  page?: number;
  pageSize?: number;
}

/** 分页响应 */
export interface StoreListResult {
  items: import("@lynxkit/shared").StoreProduct[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** 上架商店产品输入（与 createStoreProductSchema 对应） */
export interface PublishStoreProductInput {
  /** 关联构建会话 ID */
  sessionId: string;
  name: string;
  description: string;
  readme?: string;
  category: import("@lynxkit/shared").StoreCategory;
  productType: ProductType;
  pricingType: import("@lynxkit/shared").PricingType;
  /** 价格（分），FREE 时为 0 */
  price: number;
  subscriptionMonths?: number;
  coverUrl?: string;
  demoUrl?: string;
  repoUrl?: string;
  tags?: string[];
  version?: string;
}

/** 更新商店产品输入 */
export interface UpdateStoreProductInput {
  name?: string;
  description?: string;
  readme?: string;
  pricingType?: import("@lynxkit/shared").PricingType;
  price?: number;
  subscriptionMonths?: number;
  coverUrl?: string;
  demoUrl?: string;
  repoUrl?: string;
  tags?: string[];
  version?: string;
}

/** 上架响应 */
export interface PublishResult {
  ok: boolean;
  product: import("@lynxkit/shared").StoreProduct;
}

/** 创建交易输入（与 createTransactionSchema 对应） */
export interface CreateTransactionInput {
  productId: string;
  type: "purchase" | "subscribe";
  paymentMethod: string;
  couponCode?: string;
}

/** 创建评价输入（与 createReviewSchema 对应） */
export interface CreateReviewInput {
  productId: string;
  transactionId: string;
  rating: number;
  content?: string;
}

// ============ 创作者 ============

/** 创作者收益统计 */
export interface CreatorStats {
  /** 累计销售额（分） */
  totalIncome: number;
  /** 累计提现金额（分） */
  totalWithdrawn: number;
  /** 可提现余额（分） */
  balance: number;
  /** 上架产品数 */
  productCount: number;
  /** 总下载量 */
  totalDownloads: number;
  /** 平均评分 */
  avgRating: number;
}

/** 更新创作者档案输入 */
export interface UpdateCreatorInput {
  displayName?: string;
  bio?: string;
  website?: string;
}

/** 提现申请输入（与 withdrawSchema 对应） */
export interface WithdrawInput {
  amount: number;
  accountId: string;
}

// ============ AI 模型配置 ============

/** 保存 AI 模型配置输入（与 aiModelConfigSchema 对应） */
export interface UpsertAiModelInput {
  provider: AIProvider;
  apiKey: string;
  apiBase: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

/** 测试 AI 模型连通性结果 */
export interface TestAiModelResult {
  ok: boolean;
  /** 实际响应耗时（毫秒） */
  latencyMs?: number;
  /** 模型返回的示例文本 */
  sample?: string;
  /** 失败原因 */
  error?: string;
}
