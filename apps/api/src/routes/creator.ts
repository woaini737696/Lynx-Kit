/**
 * 创作者中心路由 - LynxKit API
 *
 * 端点（全部需 auth 中间件）：
 *   GET  /profile       获取创作者档案
 *   POST /profile       创建/更新档案
 *   GET  /products      列出我的产品
 *   GET  /earnings      收益统计
 *   GET  /analytics     数据分析
 *
 * 创作者档案与 users 一对一；首次访问自动创建空档案。
 */
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and, desc, sql, count, sum } from "drizzle-orm";

import {
  creatorProfiles,
  storeProducts,
  transactions,
  reviews,
  users,
} from "@lynxkit/db";
import { getDb } from "../lib/db.js";
import { logger } from "../lib/logger.js";
import { getCurrentUser } from "../middleware/auth.js";
import { NotFoundError } from "../middleware/error.js";

export const creatorRoutes = new Hono();

/**
 * 创建/更新档案请求体
 */
const upsertProfileSchema = z.object({
  bio: z.string().max(500, "简介最多 500 字").optional(),
  website: z.string().url("网站地址格式错误").optional(),
  github: z.string().max(200).optional(),
  twitter: z.string().max(200).optional(),
});

/**
 * 数据分析时间范围
 */
const analyticsQuerySchema = z.object({
  range: z.enum(["7d", "30d", "90d", "all"]).default("30d"),
});

/**
 * @openapi
 * GET /creator/profile
 * @summary 获取创作者档案（不存在则自动创建空档案）
 * @tags creator
 * @security BearerAuth
 */
creatorRoutes.get("/profile", async (c) => {
  const user = getCurrentUser(c);
  const db = getDb();

  let profile = await db.query.creatorProfiles.findFirst({
    where: eq(creatorProfiles.userId, user.id),
  });

  // 首次访问自动创建空档案
  if (!profile) {
    const [created] = await db
      .insert(creatorProfiles)
      .values({ userId: user.id })
      .returning();
    profile = created;
    logger.info({ userId: user.id }, "创作者档案已自动创建");
  }

  return c.json({ profile });
});

/**
 * @openapi
 * POST /creator/profile
 * @summary 创建/更新创作者档案
 * @tags creator
 * @security BearerAuth
 */
creatorRoutes.post(
  "/profile",
  zValidator("json", upsertProfileSchema),
  async (c) => {
    const input = c.req.valid("json");
    const user = getCurrentUser(c);
    const db = getDb();

    const existing = await db.query.creatorProfiles.findFirst({
      where: eq(creatorProfiles.userId, user.id),
    });

    let profile;
    if (existing) {
      [profile] = await db
        .update(creatorProfiles)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(creatorProfiles.id, existing.id))
        .returning();
    } else {
      [profile] = await db
        .insert(creatorProfiles)
        .values({ userId: user.id, ...input })
        .returning();
    }

    // 同步更新用户角色为 CREATOR
    await db
      .update(users)
      .set({ role: "CREATOR", updatedAt: new Date() })
      .where(eq(users.id, user.id));

    logger.info({ userId: user.id }, "创作者档案已更新");

    return c.json({ profile });
  },
);

/**
 * @openapi
 * GET /creator/products
 * @summary 列出我上架的产品
 * @tags creator
 * @security BearerAuth
 */
creatorRoutes.get("/products", async (c) => {
  const user = getCurrentUser(c);
  const db = getDb();

  const products = await db.query.storeProducts.findMany({
    where: eq(storeProducts.creatorId, user.id),
    orderBy: [desc(storeProducts.createdAt)],
    limit: 100,
  });

  return c.json({ products, total: products.length });
});

/**
 * @openapi
 * GET /creator/earnings
 * @summary 收益统计
 * @tags creator
 * @security BearerAuth
 */
creatorRoutes.get("/earnings", async (c) => {
  const user = getCurrentUser(c);
  const db = getDb();

  // 聚合查询：总收益、已完成订单数、本月收益
  const earningsResult = await db
    .select({
      totalRevenue: sum(transactions.sellerRevenue),
      totalOrders: count(),
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.sellerId, user.id),
        eq(transactions.status, "COMPLETED"),
      ),
    );

  // 本月收益
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEarnings = await db
    .select({
      monthRevenue: sum(transactions.sellerRevenue),
      monthOrders: count(),
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.sellerId, user.id),
        eq(transactions.status, "COMPLETED"),
        sql`${transactions.completedAt} >= ${monthStart}`,
      ),
    );

  const profile = await db.query.creatorProfiles.findFirst({
    where: eq(creatorProfiles.userId, user.id),
  });

  return c.json({
    totalRevenue: earningsResult[0]?.totalRevenue ?? "0",
    totalOrders: earningsResult[0]?.totalOrders ?? 0,
    monthRevenue: monthEarnings[0]?.monthRevenue ?? "0",
    monthOrders: monthEarnings[0]?.monthOrders ?? 0,
    pendingWithdraw: profile?.totalRevenue ?? "0",
  });
});

/**
 * @openapi
 * GET /creator/analytics
 * @summary 数据分析（产品 / 评价 / 销售趋势）
 * @tags creator
 * @security BearerAuth
 */
creatorRoutes.get(
  "/analytics",
  zValidator("query", analyticsQuerySchema),
  async (c) => {
    const { range } = c.req.valid("query");
    const user = getCurrentUser(c);
    const db = getDb();

    // 计算时间范围
    const now = Date.now();
    const rangeMs =
      range === "7d" ? 7 * 24 * 3600 * 1000 :
      range === "30d" ? 30 * 24 * 3600 * 1000 :
      range === "90d" ? 90 * 24 * 3600 * 1000 :
      Number.MAX_SAFE_INTEGER;
    const startDate = new Date(now - rangeMs);

    // 产品统计
    const productStats = await db
      .select({
        totalProducts: count(),
      })
      .from(storeProducts)
      .where(eq(storeProducts.creatorId, user.id));

    // 时间范围内的销售趋势
    const salesTrend = await db
      .select({
        date: sql<string>`date_trunc('day', ${transactions.createdAt})`,
        orders: count(),
        revenue: sum(transactions.sellerRevenue),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.sellerId, user.id),
          eq(transactions.status, "COMPLETED"),
          sql`${transactions.createdAt} >= ${startDate}`,
        ),
      )
      .groupBy(sql`date_trunc('day', ${transactions.createdAt})`)
      .orderBy(sql`date_trunc('day', ${transactions.createdAt})`);

    // 评价统计
    const reviewStats = await db
      .select({
        totalReviews: count(),
        avgRating: sql<number>`avg(${reviews.rating})`,
      })
      .from(reviews)
      .innerJoin(storeProducts, eq(reviews.productId, storeProducts.id))
      .where(eq(storeProducts.creatorId, user.id));

    // 产品列表（含统计）
    const topProducts = await db.query.storeProducts.findMany({
      where: eq(storeProducts.creatorId, user.id),
      orderBy: [desc(storeProducts.usageCount)],
      limit: 10,
    });

    return c.json({
      range,
      summary: {
        totalProducts: productStats[0]?.totalProducts ?? 0,
        totalReviews: reviewStats[0]?.totalReviews ?? 0,
        avgRating: reviewStats[0]?.avgRating
          ? Math.round(Number(reviewStats[0].avgRating) * 100) / 100
          : 0,
      },
      salesTrend,
      topProducts,
    });
  },
);
