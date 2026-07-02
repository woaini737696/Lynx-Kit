/**
 * LynxKit API 入口 - Hono.js + @hono/node-server
 *
 * 启动流程：
 *   1. 加载并校验环境变量（env.ts）
 *   2. 注册全局中间件（错误处理 → 日志 → CORS → 限流）
 *   3. 挂载 API v1 路由
 *   4. 启动 HTTP 服务（默认端口 8787）
 *
 * 路由结构：
 *   GET  /health              健康检查（无需鉴权）
 *   /api/v1/auth/*           认证（注册/登录/验证码/me/登出/刷新）
 *   /api/v1/build/*          构建会话（需 auth）
 *   /api/v1/agent/*          Agent 流式接口（需 auth）
 *   /api/v1/store/*          商店（公开 + 部分 auth）
 *   /api/v1/creator/*        创作者中心（需 auth）
 *   /api/v1/system/*         系统（健康/模板/AI Provider/配置）
 */
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { authRoutes } from "./routes/auth.js";
import { buildRoutes } from "./routes/build.js";
import { agentRoutes } from "./routes/agent.js";
import { storeRoutes } from "./routes/store.js";
import { creatorRoutes } from "./routes/creator.js";
import { systemRoutes } from "./routes/system.js";

import { errorHandler, registerErrorHandler } from "./middleware/error.js";
import { authMiddleware } from "./middleware/auth.js";
import { rateLimitMiddleware } from "./middleware/ratelimit.js";
import { requestLogger } from "./middleware/logging.js";

import { env, corsOrigins } from "./env.js";
import { logger as pinoLogger } from "./lib/logger.js";

const app = new Hono();

// ===== 全局错误处理器（注册到 app.onError）=====
registerErrorHandler(app);

// ===== 全局中间件 =====
// errorHandler 中间件用于记录请求上下文（实际错误捕获在 onError 中）
app.use("*", errorHandler);
// pino 请求日志（生成 requestId）
app.use("*", requestLogger);
// CORS
app.use(
  "*",
  cors({
    origin: corsOrigins,
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: [
      "Authorization",
      "Content-Type",
      "X-Refresh-Token",
      "X-Request-Id",
    ],
    exposeHeaders: ["X-Request-Id", "RateLimit-Limit", "RateLimit-Remaining", "Retry-After"],
  }),
);
// Hono 内置简易日志（与 pino 互补，仅在控制台打印请求行）
app.use("*", logger());

// API 路由限流（公开健康检查不限流）
app.use("/api/*", rateLimitMiddleware);

// ===== 健康检查（无需鉴权）=====
app.get("/health", (c) =>
  c.json({ status: "ok", timestamp: Date.now(), service: "lynxkit-api" }),
);

// ===== API v1 路由 =====
const v1 = new Hono();

// 认证路由（公开）
v1.route("/auth", authRoutes);

// 构建会话路由（全部需 auth）
v1.use("/build/*", authMiddleware);
v1.route("/build", buildRoutes);

// Agent 流式接口（全部需 auth）
v1.use("/agent/*", authMiddleware);
v1.route("/agent", agentRoutes);

// 商店路由（公开 + 部分需 auth，auth 在路由内部按需挂载）
v1.route("/store", storeRoutes);

// 创作者中心（全部需 auth）
v1.use("/creator/*", authMiddleware);
v1.route("/creator", creatorRoutes);

// 系统路由（公开）
v1.route("/system", systemRoutes);

app.route("/api/v1", v1);

// ===== 404 兜底 =====
app.notFound((c) =>
  c.json(
    {
      status: 404,
      code: "NOT_FOUND",
      message: `路径 ${c.req.method} ${c.req.path} 不存在`,
    },
    404,
  ),
);

// ===== 启动服务 =====
const port = env.PORT;

// 动态导入 @hono/node-server（避免在 Cloudflare Workers 环境下的类型问题）
const { serve } = await import("@hono/node-server");

serve(
  { fetch: app.fetch, port },
  (info) => {
    pinoLogger.info(
      { port: info.port, env: env.NODE_ENV },
      `🚀 LynxKit API running at http://localhost:${info.port}`,
    );
  },
);

// ===== 优雅停机 =====
async function gracefulShutdown(signal: string): Promise<void> {
  pinoLogger.info({ signal }, "收到停机信号，开始优雅关闭...");
  const { closeRedis } = await import("./lib/redis.js");
  const { closeBuildQueue } = await import("./lib/queue.js");
  await Promise.all([closeRedis(), closeBuildQueue()]);
  pinoLogger.info("所有连接已关闭，进程退出");
  process.exit(0);
}

process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => void gracefulShutdown("SIGINT"));

export default app;
