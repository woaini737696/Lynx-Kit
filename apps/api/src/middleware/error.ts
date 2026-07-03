/**
 * 全局错误处理中间件 - LynxKit API
 *
 * 职责：
 *   - 捕获所有未处理异常（包括 zod 校验失败、数据库错误、业务异常）
 *   - 统一返回 JSON 错误响应（含错误码、消息、requestId）
 *   - 上报到 Sentry（已配置 SENTRY_DSN 时）
 *   - 记录到 pino logger
 *
 * 用法：app.use('*', errorHandler) 注册为最早的中间件。
 */
import type { Context, MiddlewareHandler } from "hono";
import type { ZodError } from "zod";

import { env } from "../env.js";
import { logger } from "../lib/logger.js";
import { getRequestId } from "./logging.js";

/**
 * 统一错误响应体结构
 */
export interface ErrorResponseBody {
  /** 错误码（HTTP 状态码一致） */
  status: number;
  /** 机器可读的错误标识 */
  code: string;
  /** 人类可读的错误消息 */
  message: string;
  /** 请求 ID（用于追踪） */
  requestId: string;
  /** 详细错误信息（仅开发环境返回） */
  details?: unknown;
}

/**
 * 业务异常基类
 *
 * 路由中抛出 HttpError 子类，由 errorHandler 统一捕获并格式化响应。
 */
export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string = "INTERNAL_ERROR",
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

/** 400 Bad Request */
export class BadRequestError extends HttpError {
  constructor(message: string, details?: unknown) {
    super(400, message, "BAD_REQUEST", details);
  }
}

/** 401 Unauthorized */
export class UnauthorizedError extends HttpError {
  constructor(message = "未授权，请登录") {
    super(401, message, "UNAUTHORIZED");
  }
}

/** 403 Forbidden */
export class ForbiddenError extends HttpError {
  constructor(message = "无权访问该资源") {
    super(403, message, "FORBIDDEN");
  }
}

/** 404 Not Found */
export class NotFoundError extends HttpError {
  constructor(resource = "资源") {
    super(404, `${resource}不存在`, "NOT_FOUND");
  }
}

/** 409 Conflict（如邮箱已注册） */
export class ConflictError extends HttpError {
  constructor(message: string, details?: unknown) {
    super(409, message, "CONFLICT", details);
  }
}

/** 422 Unprocessable Entity（校验失败） */
export class ValidationError extends HttpError {
  constructor(details: unknown) {
    super(422, "请求参数校验失败", "VALIDATION_ERROR", details);
  }
}

/** 429 Too Many Requests */
export class RateLimitError extends HttpError {
  constructor(message = "请求过于频繁，请稍后再试") {
    super(429, message, "RATE_LIMIT_EXCEEDED");
  }
}

/** 500 Internal Server Error */
export class InternalError extends HttpError {
  constructor(message = "服务器内部错误", details?: unknown) {
    super(500, message, "INTERNAL_ERROR", details);
  }
}

/**
 * 将异常转换为错误响应体
 */
function toErrorBody(err: unknown, c: Context): ErrorResponseBody {
  const requestId = getRequestId(c);
  const isDev = env.NODE_ENV === "development";

  // 已知的 HTTP 异常
  if (err instanceof HttpError) {
    return {
      status: err.statusCode,
      code: err.code,
      message: err.message,
      requestId,
      ...(isDev && err.details ? { details: err.details } : {}),
    };
  }

  // Zod 校验错误
  if (err && typeof err === "object" && "name" in err && err.name === "ZodError") {
    const zErr = err as ZodError;
    return {
      status: 422,
      code: "VALIDATION_ERROR",
      message: "请求参数校验失败",
      requestId,
      ...(isDev ? { details: zErr.issues } : {}),
    };
  }

  // 未知异常 → 500
  const message = err instanceof Error ? err.message : String(err);
  return {
    status: 500,
    code: "INTERNAL_ERROR",
    message: isDev ? message : "服务器内部错误",
    requestId,
    ...(isDev && err instanceof Error && err.stack ? { details: err.stack } : {}),
  };
}

/**
 * Sentry 上报（懒加载，仅在 SENTRY_DSN 配置时启用）
 */
let sentryInitialized = false;

/**
 * 通用 Sentry 异常上报（不依赖 Hono Context）
 *
 * 供 telemetry 路由 / 外部调用方使用。
 * 当 SENTRY_DSN 未配置时为 no-op。
 */
export async function captureException(
  err: unknown,
  extra?: Record<string, unknown>,
): Promise<void> {
  if (!env.SENTRY_DSN) return;
  try {
    if (!sentryInitialized) {
      const Sentry = await import("@sentry/node");
      Sentry.init({ dsn: env.SENTRY_DSN, environment: env.NODE_ENV });
      sentryInitialized = true;
    }
    const Sentry = await import("@sentry/node");
    Sentry.captureException(err, extra ? { extra } : undefined);
  } catch {
    // Sentry 上报失败不应影响错误响应
  }
}

async function reportToSentry(err: unknown, c: Context): Promise<void> {
  await captureException(err, {
    method: c.req.method,
    path: c.req.path,
    requestId: getRequestId(c),
  });
}

/**
 * 错误处理中间件
 *
 * 注意：Hono 的中间件无法用 try/catch 捕获后续 await 的异常，
 * 因此使用 app.onError() 注册全局错误处理器更可靠。
 * 此中间件导出两个部分：
 *   - errorHandler: 用于记录请求上下文（在 onError 之前执行）
 *   - registerErrorHandler: 注册到 app.onError()
 */

/**
 * 请求上下文记录中间件（在错误发生前记录请求信息）
 */
export const errorHandler: MiddlewareHandler = async (c, next) => {
  await next();
};

/**
 * 注册全局错误处理器到 Hono app
 *
 * @param app Hono 实例
 */
export function registerErrorHandler(app: {
  onError: (handler: (err: unknown, c: Context) => Response | Promise<Response>) => void;
}): void {
  app.onError(async (err, c) => {
    const body = toErrorBody(err, c);

    // 5xx 错误记录 error 级别，4xx 记录 warn
    if (body.status >= 500) {
      logger.error(
        { err, method: c.req.method, path: c.req.path, requestId: body.requestId },
        body.message,
      );
      // Sentry 上报（异步，不阻塞响应）
      void reportToSentry(err, c);
    } else {
      logger.warn(
        { method: c.req.method, path: c.req.path, requestId: body.requestId, code: body.code },
        body.message,
      );
    }

    return c.json(body as never, { status: body.status as never });
  });
}
