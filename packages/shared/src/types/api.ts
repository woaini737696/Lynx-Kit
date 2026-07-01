import { z } from "zod";

/**
 * 通用 API 响应包装
 */
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.unknown().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.unknown().optional(),
    })
    .optional(),
});

export type ApiResponse = z.infer<typeof ApiResponseSchema>;

/**
 * 分页请求
 */
export const PaginationInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof PaginationInputSchema>;

/**
 * 分页响应
 */
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    total: z.number().int(),
    page: z.number().int(),
    pageSize: z.number().int(),
    totalPages: z.number().int(),
  });

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/**
 * 错误码常量
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
  // 服务器相关
  SERVER_NOT_FOUND: "SERVER_NOT_FOUND",
  SSH_CONNECTION_FAILED: "SSH_CONNECTION_FAILED",
  // 项目相关
  PROJECT_NOT_FOUND: "PROJECT_NOT_FOUND",
  PROJECT_TYPE_INVALID: "PROJECT_TYPE_INVALID",
  // 部署相关
  DEPLOY_FAILED: "DEPLOY_FAILED",
  BUILD_FAILED: "BUILD_FAILED",
  // 系统
  INTERNAL_ERROR: "INTERNAL_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
