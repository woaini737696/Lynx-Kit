/**
 * 管理后台 - 角色管理 + 审计日志路由
 *
 * 端点：
 *   GET /admin/roles   角色定义 + 权限矩阵
 *   GET /admin/audit   审计日志（合并 users/builds/products 最近变更）
 */
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, desc, sql } from "drizzle-orm";

import { users, buildSessions, storeProducts } from "@lynxkit/db";

import { getDb } from "../../lib/db.js";
import { paginationSchema } from "./_shared.js";

export const rolesAuditRoutes = new Hono();

/**
 * GET /admin/roles
 * 返回角色定义与权限矩阵（静态数据，定义在代码中）
 */
rolesAuditRoutes.get("/roles", async (c) => {
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

/**
 * GET /admin/audit
 * 简化版审计日志：合并 users/builds/products 最近变更，按时间倒序取前 50 条
 *
 * TODO: 后续应建立独立 audit_logs 表，结构化记录 operatorId + action + target + diff
 */
rolesAuditRoutes.get("/audit", zValidator("query", paginationSchema), async (c) => {
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
