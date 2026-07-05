/**
 * 管理后台 - 构建会话 + 模板管理路由
 *
 * 端点：
 *   GET    /admin/builds          构建会话列表（分页/按状态筛选）
 *   GET    /admin/builds/:id      构建会话详情（含最近 50 条日志）
 *   DELETE /admin/builds/:id      删除构建会话
 *   GET    /admin/templates       模板列表
 *   PATCH  /admin/templates/:id  更新模板
 */
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, desc, and, count } from "drizzle-orm";

import { buildSessions, buildLogs, templates } from "@lynxkit/db";

import { getDb } from "../../lib/db.js";
import { logger } from "../../lib/logger.js";
import { getCurrentUser } from "../../middleware/auth.js";
import { NotFoundError } from "../../middleware/error.js";
import { paginationSchema } from "./_shared.js";

export const buildsAdminRoutes = new Hono();

// ============ 构建会话 ============

buildsAdminRoutes.get("/builds", zValidator("query", paginationSchema), async (c) => {
  const { page, pageSize, search, status } = c.req.valid("query");
  const db = getDb();

  const conditions = [];
  if (status) {
    conditions.push(eq(buildSessions.status, status as never));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [list, total] = await Promise.all([
    db
      .select({
        id: buildSessions.id,
        userId: buildSessions.userId,
        productType: buildSessions.productType,
        name: buildSessions.name,
        description: buildSessions.description,
        status: buildSessions.status,
        createdAt: buildSessions.createdAt,
        updatedAt: buildSessions.updatedAt,
      })
      .from(buildSessions)
      .where(where)
      .orderBy(desc(buildSessions.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ count: count() }).from(buildSessions).where(where),
  ]);

  return c.json({ list, total: total[0]?.count ?? 0, page, pageSize });
});

buildsAdminRoutes.get("/builds/:id", async (c) => {
  const { id } = c.req.param();
  const db = getDb();

  const session = await db.query.buildSessions.findFirst({
    where: eq(buildSessions.id, id),
    with: {
      logs: {
        orderBy: [desc(buildLogs.createdAt)],
        limit: 50,
      },
    },
  });

  if (!session) {
    throw new NotFoundError("构建会话");
  }

  return c.json({ session });
});

buildsAdminRoutes.delete("/builds/:id", async (c) => {
  const { id } = c.req.param();
  const currentUser = getCurrentUser(c);
  const db = getDb();

  await db.delete(buildSessions).where(eq(buildSessions.id, id));

  logger.info({ buildId: id, operatorId: currentUser.id }, "管理员删除构建会话");

  return c.json({ deleted: true });
});

// ============ 模板管理 ============

buildsAdminRoutes.get("/templates", async (c) => {
  const db = getDb();
  const list = await db
    .select({
      id: templates.id,
      type: templates.type,
      name: templates.name,
      description: templates.description,
      version: templates.version,
      isActive: templates.isActive,
      createdAt: templates.createdAt,
      updatedAt: templates.updatedAt,
    })
    .from(templates)
    .orderBy(templates.type);

  return c.json({ list });
});

const updateTemplateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

buildsAdminRoutes.patch("/templates/:id", zValidator("json", updateTemplateSchema), async (c) => {
  const { id } = c.req.param();
  const input = c.req.valid("json");
  const currentUser = getCurrentUser(c);
  const db = getDb();

  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v !== undefined) patch[k] = v;
  }
  patch.updatedAt = new Date();

  const [updated] = await db
    .update(templates)
    .set(patch)
    .where(eq(templates.id, id))
    .returning();

  if (!updated) {
    throw new NotFoundError("模板");
  }

  logger.info({ templateId: id, operatorId: currentUser.id }, "管理员更新模板");

  return c.json({ template: updated });
});
