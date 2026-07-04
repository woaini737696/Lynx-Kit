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
import { startBuildOrSync } from "../lib/build-service.js";
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
 * 校验部署请求体
 */
const deploySchema = z.object({
  /** 部署目标：aliyun-ecs / vercel / github-pages */
  target: z.enum(["aliyun-ecs", "vercel", "github-pages"]).default("aliyun-ecs"),
});

/**
 * 部署 URL 基础域名（按目标生成子域名/路径）
 *
 * - aliyun-ecs：使用主域名下的子路径（实际 DNS/SSL 由 nginx 后续配置）
 * - vercel / github-pages：返回占位 URL（前端 Vercel/GH Pages 接入属于未来迭代）
 */
const DEPLOY_BASE_DOMAIN =
  process.env.DEPLOY_BASE_DOMAIN ?? "miaox.lynxdo.com";

/**
 * 根据部署目标生成访问 URL
 */
function buildDeployUrl(target: string, sessionId: string): string {
  const short = sessionId.slice(0, 8);
  switch (target) {
    case "vercel":
      return `https://lynxkit-${short}.vercel.app`;
    case "github-pages":
      return `https://woaini737696.github.io/lynx-${short}`;
    case "aliyun-ecs":
    default:
      return `https://${DEPLOY_BASE_DOMAIN}/apps/${short}/`;
  }
}

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

    // 入队 BullMQ（Redis 不可用时由 build-service 同步降级执行）
    const startResult = await startBuildOrSync({
      sessionId: session.id,
      userId: user.id,
      userInput:
        session.description ??
        (session.config as { userInput?: string })?.userInput ??
        "",
      answers:
        (session.config as { answers?: Record<string, unknown> })?.answers ??
        input.answers,
      serverId: input.serverId ?? session.serverId ?? undefined,
      domain: input.domain,
    });

    if (startResult.sync) {
      logger.warn(
        { sessionId: session.id },
        "Redis 不可用，构建已同步执行完成（开发模式）",
      );
    } else {
      logger.info(
        { sessionId: session.id, jobId: startResult.jobId },
        "构建任务已入队",
      );
    }

    return c.json({
      sessionId: session.id,
      jobId: startResult.jobId,
      sync: startResult.sync,
      status: startResult.status,
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

/**
 * @openapi
 * POST /build/:id/deploy
 * @summary 部署构建会话（更新状态 + 生成访问 URL）
 * @tags build
 * @security BearerAuth
 *
 * 注：本接口执行「应用层部署」——更新会话状态为 DEPLOYING→DEPLOYED，
 * 生成访问 URL 并写入版本快照。真实的 SSH/CDN 上传由后续迭代接入
 * @lynxkit/deployer 模块（当前为占位实现）。
 */
buildRoutes.post(
  "/:id/deploy",
  zValidator("param", sessionIdParam),
  zValidator("json", deploySchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const input = c.req.valid("json");
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
    if (session.status === "DEPLOYING") {
      throw new BadRequestError("正在部署中，请勿重复操作");
    }

    // 1. 标记为部署中
    await db
      .update(buildSessions)
      .set({ status: "DEPLOYING", updatedAt: new Date() })
      .where(eq(buildSessions.id, id));

    // 2. 生成访问 URL
    const deployUrl = buildDeployUrl(input.target, id);

    // 3. 短暂等待模拟部署流程（DB 状态推进 + URL 写入）
    //    实际生产中此处会调用 deployer.uploadFiles + caddy.reload
    await new Promise((resolve) => setTimeout(resolve, 800));

    // 4. 更新会话：状态=已部署，写入 deployUrl，版本号自增
    const [updated] = await db
      .update(buildSessions)
      .set({
        status: "DEPLOYED",
        deployUrl,
        version: session.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(buildSessions.id, id))
      .returning();

    // 5. 写入版本快照（用于回滚）
    await db.insert(buildVersions).values({
      sessionId: id,
      version: session.version + 1,
      config: session.config,
      codeHash: `deploy-${input.target}-${id.slice(0, 8)}`,
      status: "success",
    });

    logger.info(
      { sessionId: id, target: input.target, deployUrl },
      "构建会话已部署",
    );

    return c.json({ session: updated, deployUrl });
  },
);

/**
 * @openapi
 * POST /build/:id/cancel
 * @summary 取消构建（标记为 ERROR，前端中止 SSE 流）
 * @tags build
 * @security BearerAuth
 */
buildRoutes.post(
  "/:id/cancel",
  zValidator("param", sessionIdParam),
  async (c) => {
    const { id } = c.req.valid("param");
    const user = getCurrentUser(c);
    const db = getDb();

    const session = await db.query.buildSessions.findFirst({
      where: eq(buildSessions.id, id),
      columns: { id: true, userId: true, status: true },
    });
    if (!session) {
      throw new NotFoundError("构建会话");
    }
    if (session.userId !== user.id) {
      throw new ForbiddenError();
    }

    // 仅允许在 DEVELOPING / TESTING / DEPLOYING 状态下取消
    const cancellable = ["DEVELOPING", "TESTING", "DEPLOYING", "ARCHITECTING"];
    if (!cancellable.includes(session.status)) {
      throw new BadRequestError(`当前状态 ${session.status} 不可取消`);
    }

    await db
      .update(buildSessions)
      .set({ status: "ERROR", updatedAt: new Date() })
      .where(eq(buildSessions.id, id));

    logger.info({ sessionId: id, prevStatus: session.status }, "构建已取消");

    return c.json({ ok: true, cancelled: true });
  },
);
