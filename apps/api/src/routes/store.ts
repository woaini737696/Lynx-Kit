/**
 * 商店路由 - LynxKit API
 *
 * 端点：
 *   GET  /                        商店首页（分页 + 分类筛选）
 *   GET  /:productId              产品详情
 *   GET  /category/:slug          按分类列表
 *   GET  /search                 搜索（全文 + pgvector 语义）
 *   POST /:productId/purchase     购买（需 auth）
 *   POST /:productId/review       评价（需 auth）
 *
 * 公开接口无需 auth；购买与评价需 auth 中间件。
 */
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and, desc, asc, sql, like, or } from "drizzle-orm";

import {
  storeProducts,
  transactions,
  reviews,
  storeCategoryEnum,
  transactionStatusEnum,
} from "@lynxkit/db";
import { getDb } from "../lib/db.js";
import { logger } from "../lib/logger.js";
import { authMiddleware, getCurrentUser } from "../middleware/auth.js";
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
} from "../middleware/error.js";

export const storeRoutes = new Hono();

/**
 * 商店首页查询参数
 */
const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  category: z
    .enum([
      "SOCIAL",
      "SYSTEM",
      "WORKSTATION",
      "DATA",
      "ADMIN",
      "APP",
      "MARKETING",
      "HARDWARE",
      "AGENT",
      "WORKFLOW",
    ])
    .optional(),
  sort: z.enum(["newest", "popular", "rating", "price_asc", "price_desc"]).default("newest"),
});

/**
 * 搜索查询参数
 */
const searchQuerySchema = z.object({
  q: z.string().min(1, "搜索关键词不能为空").max(100),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  /** 是否启用 pgvector 语义检索（需要产品已生成 embeddings） */
  semantic: z.coerce.boolean().default(false),
});

/**
 * 产品 ID 路径参数
 */
const productIdParam = z.object({
  productId: z.string().uuid("产品 ID 格式错误"),
});

/**
 * 购买请求体
 */
const purchaseSchema = z.object({
  paymentMethod: z.string().min(1, "请选择支付方式"),
  couponCode: z.string().optional(),
});

/**
 * 评价请求体
 */
const reviewSchema = z.object({
  transactionId: z.string().uuid("交易 ID 格式错误"),
  rating: z.number().int().min(1, "评分至少 1").max(5, "评分最高 5"),
  content: z.string().max(1000, "评价最多 1000 字").optional(),
});

/**
 * 构建排序条件
 */
function buildOrderBy(sort: string) {
  switch (sort) {
    case "popular":
      return [desc(storeProducts.usageCount)];
    case "rating":
      return [desc(storeProducts.rating)];
    case "price_asc":
      return [asc(storeProducts.price)];
    case "price_desc":
      return [desc(storeProducts.price)];
    case "newest":
    default:
      return [desc(storeProducts.createdAt)];
  }
}

/**
 * @openapi
 * GET /store
 * @summary 商店首页（分页 + 分类筛选）
 * @tags store
 */
storeRoutes.get(
  "/",
  zValidator("query", listQuerySchema),
  async (c) => {
    const query = c.req.valid("query");
    const db = getDb();

    const where = and(
      eq(storeProducts.status, "PUBLISHED"),
      query.category ? eq(storeProducts.category, query.category) : undefined,
    );

    const items = await db.query.storeProducts.findMany({
      where,
      orderBy: buildOrderBy(query.sort),
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });

    return c.json({
      products: items,
      page: query.page,
      pageSize: query.pageSize,
      total: items.length,
    });
  },
);

/**
 * @openapi
 * GET /store/:productId
 * @summary 产品详情
 * @tags store
 */
storeRoutes.get(
  "/:productId",
  zValidator("param", productIdParam),
  async (c) => {
    const { productId } = c.req.valid("param");
    const db = getDb();

    const product = await db.query.storeProducts.findFirst({
      where: eq(storeProducts.id, productId),
      with: {
        reviews: { orderBy: [desc(reviews.createdAt)], limit: 20 },
      },
    });
    if (!product) {
      throw new NotFoundError("产品");
    }

    return c.json({ product });
  },
);

/**
 * @openapi
 * GET /store/category/:slug
 * @summary 按分类列表产品
 * @tags store
 */
storeRoutes.get(
  "/category/:slug",
  zValidator("param", z.object({ slug: z.string() })),
  zValidator("query", z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(50).default(20) })),
  async (c) => {
    const { slug } = c.req.valid("param");
    const query = c.req.valid("query");
    const db = getDb();

    // 校验 slug 是合法分类
    const validCategories = [
      "SOCIAL", "SYSTEM", "WORKSTATION", "DATA", "ADMIN",
      "APP", "MARKETING", "HARDWARE", "AGENT", "WORKFLOW",
    ];
    const category = validCategories.includes(slug.toUpperCase())
      ? slug.toUpperCase()
      : slug;
    if (!validCategories.includes(category)) {
      throw new BadRequestError(`无效的分类：${slug}`);
    }

    const items = await db.query.storeProducts.findMany({
      where: and(
        eq(storeProducts.status, "PUBLISHED"),
        eq(storeProducts.category, category as (typeof storeCategoryEnum.enumValues)[number]),
      ),
      orderBy: [desc(storeProducts.createdAt)],
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });

    return c.json({ products: items, category, page: query.page, pageSize: query.pageSize });
  },
);

/**
 * @openapi
 * GET /store/search
 * @summary 搜索（全文 + pgvector 语义）
 * @tags store
 */
storeRoutes.get(
  "/search",
  zValidator("query", searchQuerySchema),
  async (c) => {
    const { q, page, pageSize, semantic } = c.req.valid("query");
    const db = getDb();

    // 全文搜索（name + description + tags）
    const items = await db.query.storeProducts.findMany({
      where: and(
        eq(storeProducts.status, "PUBLISHED"),
        or(
          like(storeProducts.name, `%${q}%`),
          like(storeProducts.description, `%${q}%`),
        ),
      ),
      orderBy: [desc(storeProducts.rating)],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    // TODO: 当 semantic=true 且产品已有 embeddings 时，
    // 使用 pgvector 的 <=> 操作符进行语义检索：
    //   sql`embeddings <=> ${queryVector}::vector`
    // 需要先用 embedding 模型将 q 转为向量

    logger.info({ q, semantic, results: items.length }, "商店搜索");

    return c.json({
      products: items,
      query: q,
      semantic,
      page,
      pageSize,
      total: items.length,
    });
  },
);

/**
 * @openapi
 * POST /store/:productId/purchase
 * @summary 购买产品
 * @tags store
 * @security BearerAuth
 */
storeRoutes.post(
  "/:productId/purchase",
  authMiddleware,
  zValidator("param", productIdParam),
  zValidator("json", purchaseSchema),
  async (c) => {
    const { productId } = c.req.valid("param");
    const input = c.req.valid("json");
    const user = getCurrentUser(c);
    const db = getDb();

    const product = await db.query.storeProducts.findFirst({
      where: eq(storeProducts.id, productId),
    });
    if (!product) {
      throw new NotFoundError("产品");
    }
    if (product.status !== "PUBLISHED") {
      throw new BadRequestError("产品未上架");
    }

    // 检查是否已购买（避免重复购买）
    const existingTx = await db.query.transactions.findFirst({
      where: and(
        eq(transactions.productId, productId),
        eq(transactions.buyerId, user.id),
        eq(transactions.status, "COMPLETED"),
      ),
    });
    if (existingTx && product.pricingType !== "SUBSCRIPTION") {
      throw new ConflictError("您已购买过该产品");
    }

    // 计算金额与平台抽成（默认 20%）
    const amount = product.price ?? "0";
    const platformFeeRate = 0.2;
    const sellerRevenue = (Number(amount) * (1 - platformFeeRate)).toFixed(2);

    const [tx] = await db
      .insert(transactions)
      .values({
        productId,
        buyerId: user.id,
        sellerId: product.creatorId,
        type: product.pricingType === "SUBSCRIPTION" ? "SUBSCRIPTION" : "PURCHASE",
        amount,
        platformFee: (Number(amount) * platformFeeRate).toFixed(2),
        sellerRevenue,
        status: "PENDING",
      })
      .returning();

    // TODO: 接入支付网关（Stripe / 支付宝 / 微信支付）
    // 当前模拟支付完成
    await db
      .update(transactions)
      .set({
        status: "COMPLETED",
        completedAt: new Date(),
      })
      .where(eq(transactions.id, tx.id));

    // 更新产品使用次数
    await db
      .update(storeProducts)
      .set({ usageCount: sql`${storeProducts.usageCount} + 1` })
      .where(eq(storeProducts.id, productId));

    logger.info({ txId: tx.id, productId, userId: user.id }, "产品购买完成");

    return c.json({ transaction: tx }, 201);
  },
);

/**
 * @openapi
 * POST /store/:productId/review
 * @summary 评价产品
 * @tags store
 * @security BearerAuth
 */
storeRoutes.post(
  "/:productId/review",
  authMiddleware,
  zValidator("param", productIdParam),
  zValidator("json", reviewSchema),
  async (c) => {
    const { productId } = c.req.valid("param");
    const input = c.req.valid("json");
    const user = getCurrentUser(c);
    const db = getDb();

    // 校验产品存在
    const product = await db.query.storeProducts.findFirst({
      where: eq(storeProducts.id, productId),
    });
    if (!product) {
      throw new NotFoundError("产品");
    }

    // 校验交易存在且属于当前用户
    const tx = await db.query.transactions.findFirst({
      where: and(
        eq(transactions.id, input.transactionId),
        eq(transactions.buyerId, user.id),
        eq(transactions.productId, productId),
        eq(transactions.status, "COMPLETED"),
      ),
    });
    if (!tx) {
      throw new BadRequestError("未找到有效的购买记录，无法评价");
    }

    // 检查是否已评价
    const existingReview = await db.query.reviews.findFirst({
      where: and(eq(reviews.productId, productId), eq(reviews.userId, user.id)),
    });
    if (existingReview) {
      throw new ConflictError("您已评价过该产品");
    }

    const [review] = await db
      .insert(reviews)
      .values({
        productId,
        userId: user.id,
        rating: input.rating,
        content: input.content,
      })
      .returning();

    // 更新产品平均评分与评价数
    const newReviewCount = product.reviewCount + 1;
    const newRating =
      (product.rating * product.reviewCount + input.rating) / newReviewCount;
    await db
      .update(storeProducts)
      .set({
        rating: Math.round(newRating * 100) / 100,
        reviewCount: newReviewCount,
      })
      .where(eq(storeProducts.id, productId));

    logger.info({ reviewId: review.id, productId, rating: input.rating }, "产品评价已提交");

    return c.json({ review }, 201);
  },
);
