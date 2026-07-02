/**
 * 统一 API 响应与分页类型 - LynxKit v1.0
 */

/**
 * 错误对象
 */
export interface ApiError {
  /** 错误码（业务语义稳定 ID） */
  code: string;
  /** 用户可读消息 */
  message: string;
  /** 附加详情（字段错误、堆栈等） */
  details?: unknown;
}

/**
 * 统一 API 响应包装
 */
export interface ApiResponse<T = unknown> {
  /** 是否成功 */
  success: boolean;
  /** 提示消息 */
  message?: string;
  /** 业务数据 */
  data?: T;
  /** 错误信息（success=false 时存在） */
  error?: ApiError;
}

/**
 * 分页请求参数
 */
export interface PaginationInput {
  /** 页码，从 1 开始 */
  page: number;
  /** 每页大小，1~100 */
  pageSize: number;
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  /** 数据项列表 */
  items: T[];
  /** 总条数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页大小 */
  pageSize: number;
  /** 总页数 */
  totalPages: number;
}

/**
 * 平台错误码常量
 */
export const ERROR_CODES = {
  // 认证相关
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  // 用户相关
  USER_NOT_FOUND: "USER_NOT_FOUND",
  USER_ALREADY_EXISTS: "USER_ALREADY_EXISTS",
  USER_SUSPENDED: "USER_SUSPENDED",
  // 构建相关
  BUILD_NOT_FOUND: "BUILD_NOT_FOUND",
  BUILD_SESSION_EXPIRED: "BUILD_SESSION_EXPIRED",
  BUILD_CONFLICT: "BUILD_CONFLICT",
  PRODUCT_TYPE_INVALID: "PRODUCT_TYPE_INVALID",
  AGENT_FAILED: "AGENT_FAILED",
  // 商店相关
  STORE_PRODUCT_NOT_FOUND: "STORE_PRODUCT_NOT_FOUND",
  TRANSACTION_FAILED: "TRANSACTION_FAILED",
  INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE",
  // AI 相关
  AI_PROVIDER_NOT_CONFIGURED: "AI_PROVIDER_NOT_CONFIGURED",
  AI_REQUEST_FAILED: "AI_REQUEST_FAILED",
  AI_RATE_LIMITED: "AI_RATE_LIMITED",
  // 部署相关
  DEPLOY_FAILED: "DEPLOY_FAILED",
  // 系统
  INTERNAL_ERROR: "INTERNAL_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  VALIDATION_FAILED: "VALIDATION_FAILED",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
