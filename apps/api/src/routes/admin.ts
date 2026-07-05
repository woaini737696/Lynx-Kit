/**
 * 管理后台路由 - LynxKit API
 *
 * 所有路由需 SUPER_ADMIN 或 ADMIN 角色（RBAC）。
 *
 * 模块：
 *   GET  /admin/stats           数据看板（用户/构建/收入统计）
 *   GET  /admin/users           用户管理（列表/搜索/筛选）
 *   PATCH /admin/users/:id      更新用户（角色/状态/资料）
 *   DELETE /admin/users/:id     删除用户（软删除：status=DELETED）
 *   GET  /admin/configs         系统配置列表
 *   PUT  /admin/configs/:key    更新系统配置
 *   GET  /admin/store           AI 应用商店管理
 *   PATCH /admin/store/:id      更新产品（上下架/审核）
 *   DELETE /admin/store/:id     删除产品
 *   GET  /admin/builds          代码库管理（构建会话列表）
 *   GET  /admin/builds/:id      构建会话详情
 *   GET  /admin/templates       模板列表
 *   PATCH /admin/templates/:id 更新模板
 *   GET  /admin/ai-models      AI 模型配置
 *   PUT  /admin/ai-models/:key 更新 AI 模型配置
 *   GET  /admin/agents          Agent 管理
 *   GET  /admin/roles           角色管理（角色列表 + 权限矩阵）
 *   GET  /admin/audit           审计日志
 */
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, desc, sql, and, ilike, count } from "drizzle-orm";

import {
  users,
  buildSessions,
  buildLogs,
  storeProducts,
  transactions,
  systemConfigs,
  templates,
  creatorProfiles,
  membershipPlans,
  userMemberships,
  sCoinBalances,
  sCoinTransactions,
} from "@lynxkit/db";

import { getDb } from "../lib/db.js";
import { logger } from "../lib/logger.js";
import { authMiddleware, getCurrentUser } from "../middleware/auth.js";
import { requireAdmin, requireSuperAdmin } from "../middleware/rbac.js";
import { BadRequestError, NotFoundError, ForbiddenError } from "../middleware/error.js";

export const adminRoutes = new Hono();

// 所有 admin 路由都需要登录 + ADMIN 角色
adminRoutes.use("*", authMiddleware, requireAdmin);

// ============ 分页参数 schema ============
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  role: z.string().optional(),
});

// ============ 1. 数据看板 ============
adminRoutes.get("/stats", async (c) => {
  const db = getDb();

  // 并行查询各项统计
  const [userCount, buildCount, productCount, txCount, creatorCount] = await Promise.all([
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(buildSessions),
    db.select({ count: count() }).from(storeProducts),
    db.select({ count: count() }).from(transactions),
    db.select({ count: count() }).from(creatorProfiles),
  ]);

  // 最近 7 天新增用户（简化：返回总数）
  const recentUsers = await db
    .select({
      id: users.id,
      phone: users.phone,
      name: users.name,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(10);

  // 最近构建会话
  const recentBuilds = await db
    .select({
      id: buildSessions.id,
      status: buildSessions.status,
      productType: buildSessions.productType,
      createdAt: buildSessions.createdAt,
    })
    .from(buildSessions)
    .orderBy(desc(buildSessions.createdAt))
    .limit(10);

  return c.json({
    totals: {
      users: userCount[0]?.count ?? 0,
      builds: buildCount[0]?.count ?? 0,
      products: productCount[0]?.count ?? 0,
      transactions: txCount[0]?.count ?? 0,
      creators: creatorCount[0]?.count ?? 0,
    },
    recent: {
      users: recentUsers,
      builds: recentBuilds,
    },
  });
});

// ============ 2. 用户管理 ============
adminRoutes.get("/users", zValidator("query", paginationSchema), async (c) => {
  const { page, pageSize, search, status, role } = c.req.valid("query");
  const db = getDb();

  const conditions = [];
  if (search) {
    conditions.push(
      sql`(${users.phone} ILIKE ${`%${search}%`} OR ${users.name} ILIKE ${`%${search}%`} OR ${users.email} ILIKE ${`%${search}%`})`,
    );
  }
  if (status) {
    conditions.push(eq(users.status, status as never));
  }
  if (role) {
    conditions.push(eq(users.role, role as never));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [list, total] = await Promise.all([
    db
      .select({
        id: users.id,
        phone: users.phone,
        email: users.email,
        name: users.name,
        avatar: users.avatar,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ count: count() }).from(users).where(where),
  ]);

  return c.json({
    list,
    total: total[0]?.count ?? 0,
    page,
    pageSize,
  });
});

const updateUserSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  role: z.enum(["USER", "CREATOR", "ADMIN", "SUPER_ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "DELETED"]).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().nullable(),
  avatar: z.string().url().optional().nullable(),
});

adminRoutes.patch("/users/:id", zValidator("json", updateUserSchema), async (c) => {
  const { id } = c.req.param();
  const input = c.req.valid("json");
  const currentUser = getCurrentUser(c);
  const db = getDb();

  // 防止自我降权/封禁
  if (id === currentUser.id) {
    if (input.role && input.role !== currentUser.role) {
      throw new ForbiddenError("不能修改自己的角色");
    }
    if (input.status && input.status !== "ACTIVE") {
      throw new ForbiddenError("不能封禁自己");
    }
  }

  // 只有 SUPER_ADMIN 能授予/撤销 SUPER_ADMIN
  if (input.role === "SUPER_ADMIN" && currentUser.role !== "SUPER_ADMIN") {
    throw new ForbiddenError("仅超级管理员可授予超级管理员角色");
  }

  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v !== undefined) patch[k] = v;
  }
  patch.updatedAt = new Date();

  const [updated] = await db
    .update(users)
    .set(patch)
    .where(eq(users.id, id))
    .returning();

  if (!updated) {
    throw new NotFoundError("用户");
  }

  logger.info(
    { targetId: id, operatorId: currentUser.id, patch },
    "管理员更新用户",
  );

  return c.json({
    user: {
      id: updated.id,
      phone: updated.phone,
      email: updated.email,
      name: updated.name,
      avatar: updated.avatar,
      role: updated.role,
      status: updated.status,
    },
  });
});

adminRoutes.delete("/users/:id", async (c) => {
  const { id } = c.req.param();
  const currentUser = getCurrentUser(c);
  const db = getDb();

  if (id === currentUser.id) {
    throw new ForbiddenError("不能删除自己");
  }

  // 软删除：将状态改为 DELETED
  const [updated] = await db
    .update(users)
    .set({ status: "DELETED", updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();

  if (!updated) {
    throw new NotFoundError("用户");
  }

  logger.info({ targetId: id, operatorId: currentUser.id }, "管理员删除用户（软删除）");

  return c.json({ deleted: true });
});

// ============ 3. 系统配置 ============
adminRoutes.get("/configs", async (c) => {
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

adminRoutes.put("/configs/:key", zValidator("json", upsertConfigSchema), async (c) => {
  const { key } = c.req.param();
  const { value } = c.req.valid("json");
  const currentUser = getCurrentUser(c);
  const db = getDb();

  // Upsert：存在则更新，不存在则插入
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

adminRoutes.delete("/configs/:key", async (c) => {
  const { key } = c.req.param();
  const currentUser = getCurrentUser(c);
  const db = getDb();

  await db.delete(systemConfigs).where(eq(systemConfigs.key, key));

  logger.info({ key, operatorId: currentUser.id }, "管理员删除系统配置");

  return c.json({ deleted: true });
});

// ============ 4. AI 应用商店管理 ============
adminRoutes.get("/store", zValidator("query", paginationSchema), async (c) => {
  const { page, pageSize, search, status } = c.req.valid("query");
  const db = getDb();

  const conditions = [];
  if (search) {
    conditions.push(
      sql`(${storeProducts.name} ILIKE ${`%${search}%`} OR ${storeProducts.description} ILIKE ${`%${search}%`})`,
    );
  }
  if (status) {
    conditions.push(eq(storeProducts.status, status as never));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [list, total] = await Promise.all([
    db
      .select({
        id: storeProducts.id,
        name: storeProducts.name,
        description: storeProducts.description,
        pricingType: storeProducts.pricingType,
        price: storeProducts.price,
        status: storeProducts.status,
        category: storeProducts.category,
        createdAt: storeProducts.createdAt,
        updatedAt: storeProducts.updatedAt,
      })
      .from(storeProducts)
      .where(where)
      .orderBy(desc(storeProducts.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ count: count() }).from(storeProducts).where(where),
  ]);

  return c.json({ list, total: total[0]?.count ?? 0, page, pageSize });
});

const updateStoreProductSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["DRAFT", "PENDING_REVIEW", "PUBLISHED", "REJECTED", "SUSPENDED"]).optional(),
  category: z.string().optional(),
  price: z.number().optional(),
});

adminRoutes.patch("/store/:id", zValidator("json", updateStoreProductSchema), async (c) => {
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
    .update(storeProducts)
    .set(patch)
    .where(eq(storeProducts.id, id))
    .returning();

  if (!updated) {
    throw new NotFoundError("产品");
  }

  logger.info({ productId: id, operatorId: currentUser.id, patch }, "管理员更新产品");

  return c.json({ product: updated });
});

adminRoutes.delete("/store/:id", async (c) => {
  const { id } = c.req.param();
  const currentUser = getCurrentUser(c);
  const db = getDb();

  await db.delete(storeProducts).where(eq(storeProducts.id, id));

  logger.info({ productId: id, operatorId: currentUser.id }, "管理员删除产品");

  return c.json({ deleted: true });
});

// ============ 5. 代码库管理（构建会话 + 模板）============
adminRoutes.get("/builds", zValidator("query", paginationSchema), async (c) => {
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

adminRoutes.get("/builds/:id", async (c) => {
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

adminRoutes.delete("/builds/:id", async (c) => {
  const { id } = c.req.param();
  const currentUser = getCurrentUser(c);
  const db = getDb();

  await db.delete(buildSessions).where(eq(buildSessions.id, id));

  logger.info({ buildId: id, operatorId: currentUser.id }, "管理员删除构建会话");

  return c.json({ deleted: true });
});

// 模板管理
adminRoutes.get("/templates", async (c) => {
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

adminRoutes.patch("/templates/:id", zValidator("json", updateTemplateSchema), async (c) => {
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

// ============ 6. AI 模型管理（通过 system_configs 存储配置）============
adminRoutes.get("/ai-models", async (c) => {
  const db = getDb();

  // AI 模型配置存储在 system_configs 表中，key 前缀为 ai.provider.*
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

adminRoutes.put("/ai-models/:key", zValidator("json", upsertAiModelSchema), async (c) => {
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

adminRoutes.delete("/ai-models/:key", async (c) => {
  const { key } = c.req.param();
  const currentUser = getCurrentUser(c);
  const db = getDb();

  const fullKey = `ai.${key}`;

  await db.delete(systemConfigs).where(eq(systemConfigs.key, fullKey));

  logger.info({ key: fullKey, operatorId: currentUser.id }, "管理员删除 AI 模型配置");

  return c.json({ deleted: true });
});

// ============ 7. Agent 管理（通过 system_configs 存储配置）============
adminRoutes.get("/agents", async (c) => {
  const db = getDb();

  // Agent 配置存储在 system_configs 表中，key 前缀为 agent.*
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

adminRoutes.put("/agents/:key", zValidator("json", upsertAgentSchema), async (c) => {
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

adminRoutes.delete("/agents/:key", async (c) => {
  const { key } = c.req.param();
  const currentUser = getCurrentUser(c);
  const db = getDb();

  const fullKey = `agent.${key}`;

  await db.delete(systemConfigs).where(eq(systemConfigs.key, fullKey));

  logger.info({ key: fullKey, operatorId: currentUser.id }, "管理员删除 Agent 配置");

  return c.json({ deleted: true });
});

// ============ 8. 角色管理 ============
adminRoutes.get("/roles", async (c) => {
  // 返回角色定义和权限矩阵
  return c.json({
    roles: [
      {
        key: "USER",
        name: "普通用户",
        description: "可使用产品功能，浏览商店",
        permissions: ["store:view", "build:create", "profile:edit"],
      },
      {
        key: "CREATOR",
        name: "创作者",
        description: "可在商店发布产品，管理自己的产品",
        permissions: [
          "store:view",
          "build:create",
          "profile:edit",
          "store:publish",
          "creator:manage",
        ],
      },
      {
        key: "ADMIN",
        name: "管理员",
        description: "可管理用户、商店、系统配置（不可管理超级管理员）",
        permissions: [
          "store:view",
          "build:create",
          "profile:edit",
          "store:publish",
          "creator:manage",
          "admin:access",
          "user:manage",
          "store:manage",
          "config:manage",
          "build:manage",
        ],
      },
      {
        key: "SUPER_ADMIN",
        name: "超级管理员",
        description: "拥有全部权限，可管理管理员账号和角色",
        permissions: ["*"],
      },
    ],
  });
});

// ============ 9. 审计日志（简化版：返回最近的操作日志）============
adminRoutes.get("/audit", zValidator("query", paginationSchema), async (c) => {
  // 审计日志目前通过 pino logger 记录到日志文件
  // 这里返回简化版的审计信息（最近的用户/构建/产品变更）
  const db = getDb();

  const [recentUsers, recentBuilds, recentProducts] = await Promise.all([
    db
      .select({
        type: sql`'user'::text`.as("type"),
        id: users.id,
        action: sql`'updated'::text`.as("action"),
        timestamp: users.updatedAt,
      })
      .from(users)
      .orderBy(desc(users.updatedAt))
      .limit(20),
    db
      .select({
        type: sql`'build'::text`.as("type"),
        id: buildSessions.id,
        action: sql`cast(${buildSessions.status} as text)`.as("action"),
        timestamp: buildSessions.updatedAt,
      })
      .from(buildSessions)
      .orderBy(desc(buildSessions.updatedAt))
      .limit(20),
    db
      .select({
        type: sql`'product'::text`.as("type"),
        id: storeProducts.id,
        action: sql`cast(${storeProducts.status} as text)`.as("action"),
        timestamp: storeProducts.updatedAt,
      })
      .from(storeProducts)
      .orderBy(desc(storeProducts.updatedAt))
      .limit(20),
  ]);

  // 合并并按时间倒序
  const auditLog = [...recentUsers, ...recentBuilds, ...recentProducts]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 50);

  return c.json({
    list: auditLog,
    total: auditLog.length,
  });
});

// ============ 10. 会员管理（迭代 14C）============

/**
 * 手动开通/续费会员 schema
 * - tier: 目标档位
 * - durationMonths: 开通时长（月）
 * - source: 开通来源（默认 MANUAL）
 * - note: 备注
 */
const grantMembershipSchema = z.object({
  userId: z.string().uuid(),
  tier: z.enum(["FREE", "LITE", "PRO", "MAX"]),
  durationMonths: z.number().int().min(1).max(36),
  source: z.enum(["MANUAL", "GIFT", "TRIAL"]).default("MANUAL"),
  note: z.string().max(500).optional(),
});

/**
 * 调整 S 币余额 schema
 * - delta: 正数赠送，负数扣减
 * - note: 备注
 */
const adjustSCoinSchema = z.object({
  userId: z.string().uuid(),
  delta: z.number().int().refine((n) => n !== 0, "delta 不能为 0"),
  note: z.string().max(500).optional(),
});

/**
 * GET /admin/memberships/plans
 * 获取所有会员档位配置（含禁用的）
 */
adminRoutes.get("/memberships/plans", async (c) => {
  const db = getDb();
  const plans = await db
    .select()
    .from(membershipPlans)
    .orderBy(membershipPlans.sortOrder);

  return c.json({ list: plans });
});

/**
 * GET /admin/memberships
 * 用户会员管理列表（分页 + 搜索）
 *
 * 返回每个用户的当前会员状态 + S 币余额
 */
adminRoutes.get("/memberships", zValidator("query", paginationSchema), async (c) => {
  const db = getDb();
  const { page, pageSize, search } = c.req.valid("query");
  const offset = (page - 1) * pageSize;

  // 构造查询：users LEFT JOIN user_memberships（ACTIVE）+ LEFT JOIN scoin_balances
  const userQuery = db
    .select({
      id: users.id,
      phone: users.phone,
      name: users.name,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(search ? ilike(users.phone, `%${search}%`) : sql`TRUE`)
    .orderBy(desc(users.createdAt))
    .limit(pageSize)
    .offset(offset);

  const userList = await userQuery;
  const totalRows = await db
    .select({ count: count() })
    .from(users)
    .where(search ? ilike(users.phone, `%${search}%`) : sql`TRUE`);

  // 并行查询每个用户的会员状态 + S 币余额
  const enriched = await Promise.all(
    userList.map(async (u) => {
      const [membership, balance] = await Promise.all([
        db
          .select()
          .from(userMemberships)
          .where(
            and(
              eq(userMemberships.userId, u.id),
              eq(userMemberships.status, "ACTIVE"),
            ),
          )
          .orderBy(desc(userMemberships.createdAt))
          .limit(1)
          .then((rows) => rows[0] ?? null),
        db
          .select()
          .from(sCoinBalances)
          .where(eq(sCoinBalances.userId, u.id))
          .limit(1)
          .then((rows) => rows[0] ?? null),
      ]);
      return {
        ...u,
        membership: membership
          ? {
              tier: membership.tier,
              status: membership.status,
              source: membership.source,
              startedAt: membership.startedAt,
              expiresAt: membership.expiresAt,
            }
          : null,
        scoinBalance: balance?.balance ?? 0,
      };
    }),
  );

  return c.json({
    list: enriched,
    total: totalRows[0]?.count ?? 0,
    page,
    pageSize,
  });
});

/**
 * POST /admin/memberships/grant
 * 手动开通/续费会员
 * 1. 将用户当前 ACTIVE 会员标记为 CANCELED
 * 2. 新增一条 ACTIVE 会员记录，expiresAt = NOW + durationMonths
 * 3. 如果是付费档位，按月数赠送 S 币（monthlySCoinGrant × durationMonths）
 */
adminRoutes.post("/memberships/grant", zValidator("json", grantMembershipSchema), async (c) => {
  const db = getDb();
  const operator = getCurrentUser(c);
  const { userId, tier, durationMonths, source, note } = c.req.valid("json");

  // 1. 校验用户存在
  const targetUser = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((rows) => rows[0]);
  if (!targetUser) {
    throw new NotFoundError("目标用户不存在");
  }

  // 2. 校验档位存在
  const plan = await db
    .select()
    .from(membershipPlans)
    .where(eq(membershipPlans.tier, tier))
    .limit(1)
    .then((rows) => rows[0]);
  if (!plan) {
    throw new BadRequestError(`档位 ${tier} 不存在`);
  }

  // 3. 取消当前 ACTIVE 会员
  await db
    .update(userMemberships)
    .set({ status: "CANCELED", updatedAt: new Date() })
    .where(
      and(
        eq(userMemberships.userId, userId),
        eq(userMemberships.status, "ACTIVE"),
      ),
    );

  // 4. 计算到期时间
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

  // 5. 插入新会员记录
  const [newMembership] = await db
    .insert(userMemberships)
    .values({
      userId,
      tier,
      status: "ACTIVE",
      source,
      durationMonths,
      startedAt: now,
      expiresAt: tier === "FREE" ? null : expiresAt,
      operatorId: operator.id,
      note: note ?? `后台手动开通 ${plan.name} × ${durationMonths} 月`,
    })
    .returning();

  if (!newMembership) {
    throw new Error("会员开通失败：数据库返回空");
  }

  // 6. 付费档位赠送 S 币（monthlySCoinGrant × durationMonths）
  let grantedSCoin = 0;
  if (tier !== "FREE" && plan.monthlySCoinGrant > 0) {
    grantedSCoin = plan.monthlySCoinGrant * durationMonths;
    await grantSCoinInternal(db, userId, grantedSCoin, "GRANT", operator.id, `开通 ${plan.name} 赠送 ${grantedSCoin} S 币`, "membership", newMembership.id);
  }

  logger.info(
    { operatorId: operator.id, targetUserId: userId, tier, durationMonths, grantedSCoin, membershipId: newMembership.id },
    "管理员手动开通会员",
  );

  return c.json({
    membership: {
      id: newMembership.id,
      tier: newMembership.tier,
      status: newMembership.status,
      startedAt: newMembership.startedAt,
      expiresAt: newMembership.expiresAt,
    },
    grantedSCoin,
  });
});

/**
 * POST /admin/memberships/scoin/adjust
 * 手动调整 S 币余额（赠送/扣减）
 */
adminRoutes.post(
  "/memberships/scoin/adjust",
  zValidator("json", adjustSCoinSchema),
  async (c) => {
    const db = getDb();
    const operator = getCurrentUser(c);
    const { userId, delta, note } = c.req.valid("json");

    // 校验用户
    const targetUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then((rows) => rows[0]);
    if (!targetUser) {
      throw new NotFoundError("目标用户不存在");
    }

    const txType = delta > 0 ? "GRANT" : "ADJUST";
    const finalNote = note ?? (delta > 0 ? `后台赠送 ${delta} S 币` : `后台扣减 ${Math.abs(delta)} S 币`);

    const result = await grantSCoinInternal(
      db,
      userId,
      delta,
      txType,
      operator.id,
      finalNote,
      "admin_adjust",
      null,
    );

    logger.info(
      { operatorId: operator.id, targetUserId: userId, delta, newBalance: result.balanceAfter },
      "管理员调整 S 币余额",
    );

    return c.json({
      balance: result.balanceAfter,
      delta,
      transaction: {
        id: result.txId,
        type: txType,
        delta,
        balanceAfter: result.balanceAfter,
      },
    });
  },
);

/**
 * GET /admin/memberships/scoin/transactions
 * 全平台 S 币流水（分页 + 用户筛选）
 */
adminRoutes.get(
  "/memberships/scoin/transactions",
  zValidator("query", paginationSchema),
  async (c) => {
    const db = getDb();
    const { page, pageSize, search } = c.req.valid("query");
    const offset = (page - 1) * pageSize;

    const conditions = search
      ? ilike(users.phone, `%${search}%`)
      : sql`TRUE`;

    // join users 取手机号
    const rows = await db
      .select({
        txId: sCoinTransactions.id,
        userId: sCoinTransactions.userId,
        userPhone: users.phone,
        userName: users.name,
        type: sCoinTransactions.type,
        delta: sCoinTransactions.delta,
        balanceAfter: sCoinTransactions.balanceAfter,
        refType: sCoinTransactions.refType,
        refId: sCoinTransactions.refId,
        note: sCoinTransactions.note,
        createdAt: sCoinTransactions.createdAt,
      })
      .from(sCoinTransactions)
      .innerJoin(users, eq(sCoinTransactions.userId, users.id))
      .where(conditions)
      .orderBy(desc(sCoinTransactions.createdAt))
      .limit(pageSize)
      .offset(offset);

    const totalRows = await db
      .select({ count: count() })
      .from(sCoinTransactions)
      .innerJoin(users, eq(sCoinTransactions.userId, users.id))
      .where(conditions);

    return c.json({
      list: rows,
      total: totalRows[0]?.count ?? 0,
      page,
      pageSize,
    });
  },
);

/**
 * 内部工具函数：调整 S 币余额并写流水
 *
 * - 余额表不存在时自动插入
 * - delta 正数为增加，负数为减少（扣减时不允许透支，需先校验）
 * - 写入流水记录 balanceAfter
 */
async function grantSCoinInternal(
  db: ReturnType<typeof getDb>,
  userId: string,
  delta: number,
  type: "RECHARGE" | "CONSUME" | "GRANT" | "REFUND" | "EXCHANGE" | "ADJUST",
  operatorId: string,
  note: string,
  refType: string | null,
  refId: string | null,
): Promise<{ balanceAfter: number; txId: string }> {
  // 1. 查询当前余额（不存在则初始化）
  const existing = await db
    .select()
    .from(sCoinBalances)
    .where(eq(sCoinBalances.userId, userId))
    .limit(1)
    .then((rows) => rows[0]);

  const currentBalance = existing?.balance ?? 0;
  const newBalance = currentBalance + delta;

  if (newBalance < 0) {
    throw new BadRequestError(
      `余额不足：当前 ${currentBalance}，尝试扣减 ${Math.abs(delta)}`,
    );
  }

  // 2. 更新或插入余额表
  if (existing) {
    await db
      .update(sCoinBalances)
      .set({
        balance: newBalance,
        totalGranted: delta > 0 ? (existing.totalGranted ?? 0) + delta : existing.totalGranted,
        totalConsumed: delta < 0 ? (existing.totalConsumed ?? 0) + Math.abs(delta) : existing.totalConsumed,
        updatedAt: new Date(),
      })
      .where(eq(sCoinBalances.userId, userId));
  } else {
    await db.insert(sCoinBalances).values({
      userId,
      balance: newBalance,
      totalGranted: delta > 0 ? delta : 0,
      totalConsumed: delta < 0 ? Math.abs(delta) : 0,
    });
  }

  // 3. 写流水
  const [tx] = await db
    .insert(sCoinTransactions)
    .values({
      userId,
      type,
      delta,
      balanceAfter: newBalance,
      refType,
      refId,
      operatorId,
      note,
    })
    .returning();

  if (!tx) {
    throw new Error("S 币流水写入失败");
  }

  return { balanceAfter: newBalance, txId: tx.id };
}
