/**
 * 遥测路由 - LynxKit API
 *
 * 接收客户端（桌面端 / Web）上报的错误和性能指标，转发到 Sentry。
 *
 * 路由：
 *   POST /errors  — 客户端错误上报（转发到 Sentry captureException）
 *   POST /vitals  — Web Vitals 性能指标（转发到 Sentry，仅记录 poor 评级）
 *
 * 全部公开（无需鉴权），因为客户端可能在未登录时也需要上报。
 */
import { Hono } from "hono";
import { z } from "zod";
import { captureException } from "../middleware/error.js";
import { logger } from "../lib/logger.js";

export const telemetryRoutes = new Hono();

// ===== 错误上报 =====
const errorReportSchema = z.object({
  message: z.string().min(1).max(2000),
  stack: z.string().optional(),
  url: z.string().optional(),
  userAgent: z.string().optional(),
  context: z.record(z.unknown()).optional(),
  timestamp: z.string().optional(),
});

telemetryRoutes.post("/errors", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) {
    return c.json({ ok: false, error: "invalid json" }, 400);
  }

  const parsed = errorReportSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ ok: false, error: "validation failed" }, 422);
  }

  const { message, stack, url, userAgent, context } = parsed.data;

  // 构造 Error 对象转发到 Sentry
  const err = new Error(message);
  if (stack) err.stack = stack;

  void captureException(err, {
    ...context,
    url,
    userAgent,
    source: "client",
  });

  logger.debug({ message, url }, "客户端错误已上报");

  return c.json({ ok: true });
});

// ===== Web Vitals 上报 =====
const vitalsSchema = z.object({
  metrics: z.array(
    z.object({
      name: z.string(),
      value: z.number(),
      rating: z.string().optional(),
      id: z.string().optional(),
      navigationType: z.string().optional(),
    }),
  ),
  url: z.string().optional(),
  userAgent: z.string().optional(),
});

telemetryRoutes.post("/vitals", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) {
    return c.json({ ok: false, error: "invalid json" }, 400);
  }

  const parsed = vitalsSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ ok: false, error: "validation failed" }, 422);
  }

  const { metrics, url, userAgent } = parsed.data;

  // 仅 poor 评级的指标值得上报到 Sentry
  const poorMetrics = metrics.filter((m) => m.rating === "poor");
  if (poorMetrics.length > 0) {
    const err = new Error(
      `Web Vitals poor: ${poorMetrics.map((m) => `${m.name}=${m.value.toFixed(2)}`).join(", ")}`,
    );
    void captureException(err, {
      url,
      userAgent,
      source: "web-vitals",
      metrics: poorMetrics,
    });
  }

  logger.debug(
    { count: metrics.length, poor: poorMetrics.length, url },
    "Web Vitals 已接收",
  );

  return c.json({ ok: true });
});
