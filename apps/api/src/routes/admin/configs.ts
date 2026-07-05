/**
 * 管理后台 - 系统配置 + AI 模型 + Agent 路由
 *
 * 端点：
 *   GET    /admin/configs           系统配置列表
 *   PUT    /admin/configs/:key      Upsert 系统配置
 *   DELETE /admin/configs/:key      删除系统配置
 *   GET    /admin/ai-models         AI 模型配置（key 前缀 ai.*）
 *   PUT    /admin/ai-models/:key    Upsert AI 模型配置
 *   DELETE /admin/ai-models/:key    删除 AI 模型配置
 *   GET    /admin/agents            Agent 配置（key 前缀 agent.*）
 *   PUT    /admin/agents/:key       Upsert Agent 配置
 *   DELETE /admin/agents/:key       删除 Agent 配置
 */
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, sql } from "drizzle-orm";

import { systemConfigs } from "@lynxkit/db";

import { getDb } from "../../lib/db.js";
import { logger } from "../../lib/logger.js";
import { getCurrentUser } from "../../middleware/auth.js";

export const configsRoutes = new Hono();

// ============ 系统配置 ============

configsRoutes.get("/configs", async (c) => {
  const db = getDb();
  const list = await db
    .select({
      id: systemConfigs.id,
      key: systemConfigs.key,
      value: systemConfigs.value,
      updatedAt: systemConfigs.updatedAt,
    })
    .from(systemConfigs)
    .orderBy(systemConfigs.key);

  return c.json({ list });
});

const upsertConfigSchema = z.object({
  value: z.unknown(),
});

configsRoutes.put("/configs/:key", zValidator("json", upsertConfigSchema), async (c) => {
  const { key } = c.req.param();
  const { value } = c.req.valid("json");
  const currentUser = getCurrentUser(c);
  const db = getDb();

  const [upserted] = await db
    .insert(systemConfigs)
    .values({ key, value })
    .onConflictDoUpdate({
      target: systemConfigs.key,
      set: { value, updatedAt: new Date() },
    })
    .returning();

  if (!upserted) {
    throw new Error("系统配置更新失败");
  }

  logger.info(
    { key, operatorId: currentUser.id },
    "管理员更新系统配置",
  );

  return c.json({
    config: {
      id: upserted.id,
      key: upserted.key,
      value: upserted.value,
      updatedAt: upserted.updatedAt,
    },
  });
});

configsRoutes.delete("/configs/:key", async (c) => {
  const { key } = c.req.param();
  const currentUser = getCurrentUser(c);
  const db = getDb();

  await db.delete(systemConfigs).where(eq(systemConfigs.key, key));

  logger.info({ key, operatorId: currentUser.id }, "管理员删除系统配置");

  return c.json({ deleted: true });
});

// ============ AI 模型管理（key 前缀 ai.*）============

configsRoutes.get("/ai-models", async (c) => {
  const db = getDb();

  const list = await db
    .select()
    .from(systemConfigs)
    .where(sql`${systemConfigs.key} LIKE 'ai.%'`)
    .orderBy(systemConfigs.key);

  return c.json({ list });
});

const upsertAiModelSchema = z.object({
  value: z.object({
    provider: z.string(),
    models: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        enabled: z.boolean().default(true),
        maxTokens: z.number().optional(),
        pricePer1K: z.number().optional(),
      }),
    ),
  }),
});

configsRoutes.put("/ai-models/:key", zValidator("json", upsertAiModelSchema), async (c) => {
  const { key } = c.req.param();
  const { value } = c.req.valid("json");
  const currentUser = getCurrentUser(c);
  const db = getDb();

  const fullKey = `ai.${key}`;

  const [upserted] = await db
    .insert(systemConfigs)
    .values({ key: fullKey, value })
    .onConflictDoUpdate({
      target: systemConfigs.key,
      set: { value, updatedAt: new Date() },
    })
    .returning();

  if (!upserted) {
    throw new Error("AI 模型配置更新失败");
  }

  logger.info({ key: fullKey, operatorId: currentUser.id }, "管理员更新 AI 模型配置");

  return c.json({ config: upserted });
});

configsRoutes.delete("/ai-models/:key", async (c) => {
  const { key } = c.req.param();
  const currentUser = getCurrentUser(c);
  const db = getDb();

  const fullKey = `ai.${key}`;

  await db.delete(systemConfigs).where(eq(systemConfigs.key, fullKey));

  logger.info({ key: fullKey, operatorId: currentUser.id }, "管理员删除 AI 模型配置");

  return c.json({ deleted: true });
});

// ============ Agent 管理（key 前缀 agent.*）============

configsRoutes.get("/agents", async (c) => {
  const db = getDb();

  const list = await db
    .select()
    .from(systemConfigs)
    .where(sql`${systemConfigs.key} LIKE 'agent.%'`)
    .orderBy(systemConfigs.key);

  return c.json({ list });
});

const upsertAgentSchema = z.object({
  value: z.object({
    name: z.string(),
    description: z.string(),
    enabled: z.boolean().default(true),
    model: z.string().optional(),
    systemPrompt: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxSteps: z.number().int().min(1).max(50).optional(),
  }),
});

configsRoutes.put("/agents/:key", zValidator("json", upsertAgentSchema), async (c) => {
  const { key } = c.req.param();
  const { value } = c.req.valid("json");
  const currentUser = getCurrentUser(c);
  const db = getDb();

  const fullKey = `agent.${key}`;

  const [upserted] = await db
    .insert(systemConfigs)
    .values({ key: fullKey, value })
    .onConflictDoUpdate({
      target: systemConfigs.key,
      set: { value, updatedAt: new Date() },
    })
    .returning();

  if (!upserted) {
    throw new Error("Agent 配置更新失败");
  }

  logger.info({ key: fullKey, operatorId: currentUser.id }, "管理员更新 Agent 配置");

  return c.json({ config: upserted });
});

configsRoutes.delete("/agents/:key", async (c) => {
  const { key } = c.req.param();
  const currentUser = getCurrentUser(c);
  const db = getDb();

  const fullKey = `agent.${key}`;

  await db.delete(systemConfigs).where(eq(systemConfigs.key, fullKey));

  logger.info({ key: fullKey, operatorId: currentUser.id }, "管理员删除 Agent 配置");

  return c.json({ deleted: true });
});
