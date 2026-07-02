/**
 * 构建会话路由 - LynxKit API
 *
 * 端点（全部需 auth 中间件）：
 *   POST   /                   创建构建会话
 *   GET    /                   列出当前用户的会话
 *   GET    /:id                获取会话详情
 *   PUT    /:id/config         更新配置（澄清阶段补充信息）
 *   POST   /:id/start          启动 9 Agent 流程（入队 BullMQ）
 *   GET    /:id/logs           获取 Agent 日志
 *   POST   /:id/rollback       回滚到指定版本
 *   DELETE /:id                删除会话
 *
 * 数据库操作全部使用 Drizzle ORM（@lynxkit/db schema）。
 * 启动构建时入队 BullMQ，由 queues/build-worker.ts 消费并调用 agent-core orchestrator。
 */
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";

import {
  createBuildSchema,
  updateConfigSchema,
} from "@lynxkit/shared";
import {
  buildSessions,
  buildLogs,
  buildVersions,
} from "@lynxkit/db";

import { getDb } from "../lib/db.js";
import { enqueueBuild } from "../lib/queue.js";
import { logger } from "../lib/logger.js";
import { getCurrentUser } from "../middleware/auth.js";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from "../middleware/error.js";

export const buildRoutes = new Hono();

/**
 * 校验 sessionId 路径参数
 */
const sessionIdParam = z.object({
  id: z.string().uuid("会话 ID 格式错误"),
});

/**
 * 校验日志查询参数
 */
const logsQuerySchema = z.object({
  agent: z.string().optional(),
  level: z.enum(["INFO", "WARN", "ERROR", "DEBUG"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * 校验回滚请求体
 */
const rollbackSchema = z.object({
  versionId: z.string().uuid("版本 ID 格式错误"),
});

/**
 * 校验启动请求体
 */
const startBuildSchema = z.object({
  /** 目标部署服务器 ID（可选） */
  serverId: z.string().uuid().optional(),
  /** 自定义域名（可选） */
  domain: z.string().optional(),
  /** 澄清阶段补充的答案 */
  answers: z.record(z.string(), z.unknown()).optional(),
});

/**
 * @openapi
 * POST /build
 * @summary 创建构建会话
 * @tags build
 * @security BearerAuth
 */
buildRoutes.post(
  "/",
  zValidator("json", createBuildSchema),
  async (c) => {
    const input = c.req.valid("json");
    const user = getCurrentUser(c);
    const db = getDb();

    // 根据 ProductType 枚举值映射到 DB 枚举（DB 枚举为大写）
    const productType = input.productType.toUpperCase() as
      | "SOCIAL"
      | "SYSTEM"
      | "WORKSTATION"
      | "DATA"
      | "ADMIN"
      | "APP"
      | "MARKETING"
      | "HARDWARE";

    const [session] = await db
      .insert(buildSessions)
      .values({
        userId: user.id,
        name: input.userInput.slice(0, 80) || "未命名构建",
        description: input.userInput,
        productType,
        status: "DRAFT",
        config: { skipClarify: input.skipClarify, userInput: input.userInput },
      })
      .returning();

    if (!session) {
      throw new Error("构建会话创建失败");
    }

    logger.info({ sessionId: session.id, userId: user.id }, "构建会话已创建");

    return c.json({ session }, 201);
  },
);

/**
 * @openapi
 * GET /build
 * @summary 列出当前用户的构建会话
 * @tags build
 * @security BearerAuth
 */
buildRoutes.get("/", async (c) => {
  const user = getCurrentUser(c);
  const db = getDb();

  const list = await db.query.buildSessions.findMany({
    where: eq(buildSessions.userId, user.id),
    orderBy: [desc(buildSessions.createdAt)],
    limit: 50,
  });

  return c.json({ sessions: list, total: list.length });
});

/**
 * @openapi
 * GET /build/:id
 * @summary 获取构建会话详情
 * @tags build
 * @security BearerAuth
 */
buildRoutes.get(
  "/:id",
  zValidator("param", sessionIdParam),
  async (c) => {
    const { id } = c.req.valid("param");
    const user = getCurrentUser(c);
    const db = getDb();

    const session = await db.query.buildSessions.findFirst({
      where: eq(buildSessions.id, id),
      with: {
        logs: { orderBy: [desc(buildLogs.createdAt)], limit: 100 },
        versions: { orderBy: [desc(buildVersions.version)] },
      },
    });

    if (!session) {
      throw new NotFoundError("构建会话");
    }
    if (session.userId !== user.id) {
      throw new ForbiddenError("无权访问该构建会话");
    }

    return c.json({ session });
  },
);

/**
 * @openapi
 * PUT /build/:id/config
 * @summary 更新构建配置（澄清阶段补充信息）
 * @tags build
 * @security BearerAuth
 */
buildRoutes.put(
  "/:id/config",
  zValidator("param", sessionIdParam),
  zValidator("json", updateConfigSchema.omit({ sessionId: true })),
  async (c) => {
    const { id } = c.req.valid("param");
    const input = c.req.valid("json");
    const user = getCurrentUser(c);
    const db = getDb();

    const existing = await db.query.buildSessions.findFirst({
      where: eq(buildSessions.id, id),
    });
    if (!existing) {
      throw new NotFoundError("构建会话");
    }
    if (existing.userId !== user.id) {
      throw new ForbiddenError();
    }

    // 合并配置 patch
    const mergedConfig = { ...(existing.config as object), ...input.patch };

    const [updated] = await db
      .update(buildSessions)
      .set({
        config: mergedConfig,
        // 确认澄清完成 → 进入架构设计
        status: input.confirmClarify ? "ARCHITECTING" : "CLARIFYING",
        updatedAt: new Date(),
      })
      .where(eq(buildSessions.id, id))
      .returning();

    return c.json({ session: updated });
  },
);

/**
 * @openapi
 * POST /build/:id/start
 * @summary 启动 9 Agent 流程（入队 BullMQ）
 * @tags build
 * @security BearerAuth
 */
buildRoutes.post(
  "/:id/start",
  zValidator("param", sessionIdParam),
  zValidator("json", startBuildSchema.optional()),
  async (c) => {
    const { id } = c.req.valid("param");
    const input = c.req.valid("json") ?? {};
    const user = getCurrentUser(c);
    const db = getDb();

    const session = await db.query.buildSessions.findFirst({
      where: eq(buildSessions.id, id),
    });
    if (!session) {
      throw new NotFoundError("构建会话");
    }
    if (session.userId !== user.id) {
      throw new ForbiddenError();
    }
    if (session.status !== "DRAFT" && session.status !== "CLARIFYING") {
      throw new BadRequestError(`当前状态 ${session.status} 不可启动构建`);
    }

    // 更新状态为开发中
    await db
      .update(buildSessions)
      .set({ status: "DEVELOPING", updatedAt: new Date() })
      .where(eq(buildSessions.id, id));

    // 入队 BullMQ
    const jobId = await enqueueBuild({
      sessionId: session.id,
      userId: user.id,
      userInput: session.description ?? (session.config as { userInput?: string })?.userInput ?? "",
      answers: (session.config as { answers?: Record<string, unknown> })?.answers ?? input.answers,
      serverId: input.serverId ?? session.serverId ?? undefined,
      domain: input.domain,
    });

    logger.info({ sessionId: session.id, jobId }, "构建任务已入队");

    // 队列不可用时同步执行回退（开发环境）
    if (!jobId) {
      logger.warn({ sessionId: session.id }, "Redis 不可用，构建将同步执行（开发模式）");
    }

    return c.json({
      sessionId: session.id,
      jobId,
      status: "DEVELOPING",
      streamUrl: `/api/v1/agent/${session.id}/stream`,
    });
  },
);

/**
 * @openapi
 * GET /build/:id/logs
 * @summary 获取 Agent 日志
 * @tags build
 * @security BearerAuth
 */
buildRoutes.get(
  "/:id/logs",
  zValidator("param", sessionIdParam),
  zValidator("query", logsQuerySchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const query = c.req.valid("query");
    const user = getCurrentUser(c);
    const db = getDb();

    const session = await db.query.buildSessions.findFirst({
      where: eq(buildSessions.id, id),
      columns: { id: true, userId: true },
    });
    if (!session) {
      throw new NotFoundError("构建会话");
    }
    if (session.userId !== user.id) {
      throw new ForbiddenError();
    }

    const logs = await db.query.buildLogs.findMany({
      where: eq(buildLogs.sessionId, id),
      orderBy: [desc(buildLogs.createdAt)],
      limit: query.limit,
      offset: query.offset,
    });

    return c.json({ logs, total: logs.length });
  },
);

/**
 * @openapi
 * POST /build/:id/rollback
 * @summary 回滚到指定版本
 * @tags build
 * @security BearerAuth
 */
buildRoutes.post(
  "/:id/rollback",
  zValidator("param", sessionIdParam),
  zValidator("json", rollbackSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const { versionId } = c.req.valid("json");
    const user = getCurrentUser(c);
    const db = getDb();

    const session = await db.query.buildSessions.findFirst({
      where: eq(buildSessions.id, id),
    });
    if (!session) {
      throw new NotFoundError("构建会话");
    }
    if (session.userId !== user.id) {
      throw new ForbiddenError();
    }

    const version = await db.query.buildVersions.findFirst({
      where: and(eq(buildVersions.id, versionId), eq(buildVersions.sessionId, id)),
    });
    if (!version) {
      throw new NotFoundError("版本");
    }

    // 回滚：将 config 恢复到该版本快照
    const [updated] = await db
      .update(buildSessions)
      .set({
        config: version.config,
        version: version.version,
        status: "DRAFT",
        updatedAt: new Date(),
      })
      .where(eq(buildSessions.id, id))
      .returning();

    logger.info({ sessionId: id, versionId, version: version.version }, "构建已回滚");

    return c.json({ session: updated, rolledBackTo: version.version });
  },
);

/**
 * @openapi
 * DELETE /build/:id
 * @summary 删除构建会话
 * @tags build
 * @security BearerAuth
 */
buildRoutes.delete(
  "/:id",
  zValidator("param", sessionIdParam),
  async (c) => {
    const { id } = c.req.valid("param");
    const user = getCurrentUser(c);
    const db = getDb();

    const session = await db.query.buildSessions.findFirst({
      where: eq(buildSessions.id, id),
      columns: { id: true, userId: true },
    });
    if (!session) {
      throw new NotFoundError("构建会话");
    }
    if (session.userId !== user.id) {
      throw new ForbiddenError();
    }

    await db.delete(buildSessions).where(eq(buildSessions.id, id));

    logger.info({ sessionId: id }, "构建会话已删除");

    return c.json({ deleted: true });
  },
);
