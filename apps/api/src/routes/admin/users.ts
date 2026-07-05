/**
 * 管理后台 - 用户管理路由
 *
 * 端点：
 *   GET    /admin/users        列表（分页/搜索/按状态/按角色筛选）
 *   PATCH  /admin/users/:id    更新用户（角色/状态/资料）
 *   DELETE /admin/users/:id    软删除（status=DELETED）
 */
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, desc, sql, and, count } from "drizzle-orm";

import { users } from "@lynxkit/db";

import { getDb } from "../../lib/db.js";
import { logger } from "../../lib/logger.js";
import { getCurrentUser } from "../../middleware/auth.js";
import { ForbiddenError, NotFoundError } from "../../middleware/error.js";
import { paginationSchema } from "./_shared.js";

export const usersAdminRoutes = new Hono();

/**
 * GET /admin/users
 * 用户列表（支持 search/status/role 筛选）
 */
usersAdminRoutes.get("/users", zValidator("query", paginationSchema), async (c) => {
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

/**
 * PATCH /admin/users/:id
 * 更新用户（角色/状态/资料）
 * - 不能修改自己的角色
 * - 不能封禁自己
 * - 仅 SUPER_ADMIN 可授予 SUPER_ADMIN
 */
usersAdminRoutes.patch("/users/:id", zValidator("json", updateUserSchema), async (c) => {
  const { id } = c.req.param();
  const input = c.req.valid("json");
  const currentUser = getCurrentUser(c);
  const db = getDb();

  if (id === currentUser.id) {
    if (input.role && input.role !== currentUser.role) {
      throw new ForbiddenError("不能修改自己的角色");
    }
    if (input.status && input.status !== "ACTIVE") {
      throw new ForbiddenError("不能封禁自己");
    }
  }

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

/**
 * DELETE /admin/users/:id
 * 软删除用户（status=DELETED）
 */
usersAdminRoutes.delete("/users/:id", async (c) => {
  const { id } = c.req.param();
  const currentUser = getCurrentUser(c);
  const db = getDb();

  if (id === currentUser.id) {
    throw new ForbiddenError("不能删除自己");
  }

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
