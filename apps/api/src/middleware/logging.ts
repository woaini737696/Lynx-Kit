/**
 * 请求日志中间件 - LynxKit API
 *
 * 职责：
 *   - 为每个请求生成唯一 requestId（基于 nanoid）
 *   - 注入到 Hono context，供错误处理与其他中间件使用
 *   - 记录请求方法、路径、状态码、耗时
 *   - 在响应头中回传 X-Request-Id 便于客户端排查问题
 */
import type { MiddlewareHandler } from "hono";
import { nanoid } from "nanoid";

import { logger } from "../lib/logger.js";
import { recordHttpRequest, isPrometheusEnabled } from "../lib/metrics.js";

/** context 中存储 requestId 的 key */
const REQUEST_ID_KEY = "requestId";
/** 响应头名称 */
const REQUEST_ID_HEADER = "X-Request-Id";

/**
 * 从 context 获取 requestId（供错误处理使用）
 */
export function getRequestId(c: { get: (key: string) => unknown }): string {
  const id = c.get(REQUEST_ID_KEY);
  return typeof id === "string" ? id : "unknown";
}

/**
 * 请求日志中间件
 *
 * 必须注册为最早的中间件之一（在 errorHandler 之后、业务路由之前），
 * 以确保所有请求都被记录。
 */
export const requestLogger: MiddlewareHandler = async (c, next) => {
  // 优先复用客户端传入的 requestId，否则生成新的
  const clientRequestId = c.req.header(REQUEST_ID_HEADER);
  const requestId = clientRequestId || nanoid();
  c.set(REQUEST_ID_KEY, requestId);

  const start = Date.now();
  const startMemory = process.memoryUsage().heapUsed;

  await next();

  const durationMs = Date.now() - start;
  const memDelta = process.memoryUsage().heapUsed - startMemory;

  // 回传 requestId 给客户端
  c.res.headers.set(REQUEST_ID_HEADER, requestId);

  // 记录 Prometheus 指标（路由路径用 c.req.routePath 而非完整 path，避免高基数）
  if (isPrometheusEnabled()) {
    recordHttpRequest(
      c.req.method,
      c.req.routePath ?? c.req.path,
      c.res.status,
      durationMs / 1000,
    );
  }

  logger.info(
    {
      requestId,
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs,
      memDeltaKB: Math.round(memDelta / 1024),
      userAgent: c.req.header("user-agent"),
    },
    `${c.req.method} ${c.req.path} ${c.res.status} ${durationMs}ms`,
  );
};

export { REQUEST_ID_KEY, REQUEST_ID_HEADER };
