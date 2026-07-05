/**
 * 管理后台 - AI 应用商店管理路由
 *
 * 端点：
 *   GET    /admin/store          产品列表（分页/搜索/按状态筛选）
 *   PATCH  /admin/store/:id      更新产品（上下架/审核/资料）
 *   DELETE /admin/store/:id      物理删除产品
 */
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, desc, sql, and, count } from "drizzle-orm";

import { storeProducts } from "@lynxkit/db";

import { getDb } from "../../lib/db.js";
import { logger } from "../../lib/logger.js";
import { getCurrentUser } from "../../middleware/auth.js";
import { NotFoundError } from "../../middleware/error.js";
import { paginationSchema } from "./_shared.js";

export const storeAdminRoutes = new Hono();

storeAdminRoutes.get("/store", zValidator("query", paginationSchema), async (c) => {
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

storeAdminRoutes.patch("/store/:id", zValidator("json", updateStoreProductSchema), async (c) => {
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

storeAdminRoutes.delete("/store/:id", async (c) => {
  const { id } = c.req.param();
  const currentUser = getCurrentUser(c);
  const db = getDb();

  await db.delete(storeProducts).where(eq(storeProducts.id, id));

  logger.info({ productId: id, operatorId: currentUser.id }, "管理员删除产品");

  return c.json({ deleted: true });
});
