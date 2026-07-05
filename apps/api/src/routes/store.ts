/**
 * 商店路由 - LynxKit API
 *
 * 端点：
 *   GET  /                        商店首页（分页 + 分类筛选）
 *   GET  /:productId              产品详情
 *   GET  /category/:slug          按分类列表
 *   GET  /search                 搜索（全文 + pgvector 语义）
 *   POST /publish                从构建会话上架产品（需 auth）
 *   POST /:productId/purchase     购买（需 auth）
 *   POST /:productId/review       评价（需 auth）
 *
 * 公开接口无需 auth；上架 / 购买与评价需 auth 中间件。
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
import { createStoreProductSchema } from "@lynxkit/shared";
import { getDb } from "../lib/db.js";
import { publishBuildToStore } from "../lib/publish-service.js";
import { embedText, toPgVectorLiteral } from "../lib/embeddings.js";
import { logger } from "../lib/logger.js";
import { cached, cacheInvalidatePattern } from "../lib/cache.js";
import { recordStorePublish, recordStorePurchase } from "../lib/metrics.js";
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
 * 上架请求体（sessionId + createStoreProductSchema 字段）
 *
 * 复用 @lynxkit/shared 的 createStoreProductSchema 做字段校验，
 * 额外补 sessionId（必填，标识从哪个构建会话发布）。
 */
const publishSchema = createStoreProductSchema.extend({
  sessionId: z.string().uuid("会话 ID 格式错误"),
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
 * POST /store/publish
 * @summary 从构建会话上架产品到商店
 * @tags store
 * @security BearerAuth
 */
storeRoutes.post(
  "/publish",
  authMiddleware,
  zValidator("json", publishSchema),
  async (c) => {
    const input = c.req.valid("json");
    const user = getCurrentUser(c);
    const db = getDb();

    // 委托给 publish-service（含会话校验 / 重复发布检查 / 插入）
    const result = await publishBuildToStore(
      {
        sessionId: input.sessionId,
        userId: user.id,
        name: input.name,
        description: input.description,
        category: input.category,
        pricingType: input.pricingType,
        price: input.price,
        tags: input.tags,
        version: input.version,
        demoUrl: input.demoUrl,
        readme: input.readme,
        coverUrl: input.coverUrl,
        repoUrl: input.repoUrl,
        subscriptionMonths: input.subscriptionMonths,
      },
      { db },
    );

    logger.info(
      { productId: result.product.id, sessionId: input.sessionId, userId: user.id },
      "产品已上架到商店（待审核）",
    );

    // 失效商店列表缓存（新上架产品将出现在审核通过后的列表中）
    await cacheInvalidatePattern("store:list:*");

    // 记录 Prometheus 业务指标
    recordStorePublish(input.category);

    return c.json({ ok: true, product: result.product }, 201);
  },
);

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

    const cacheKey = `store:list:${query.category ?? "all"}:${query.sort}:p${query.page}:s${query.pageSize}`;
    const cachedResult = await cached(cacheKey, async () => {
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

      return {
        products: items,
        page: query.page,
        pageSize: query.pageSize,
        total: items.length,
      };
    }, 60);

    return c.json(cachedResult);
  },
);

/**
 * @openapi
 * GET /store/transactions
 * @summary 我的购买记录（需 auth）
 * @tags store
 * @security BearerAuth
 */
storeRoutes.get(
  "/transactions",
  authMiddleware,
  async (c) => {
    const user = getCurrentUser(c);
    const db = getDb();
    const items = await db.query.transactions.findMany({
      where: eq(transactions.buyerId, user.id),
      orderBy: [desc(transactions.createdAt)],
      limit: 50,
    });
    return c.json({ transactions: items });
  },
);

/**
 * @openapi
 * GET /store/:productId/reviews
 * @summary 产品的评价列表
 * @tags store
 */
storeRoutes.get(
  "/:productId/reviews",
  zValidator("param", productIdParam),
  async (c) => {
    const { productId } = c.req.valid("param");
    const db = getDb();
    const items = await db.query.reviews.findMany({
      where: eq(reviews.productId, productId),
      orderBy: [desc(reviews.createdAt)],
      limit: 50,
    });
    return c.json({ reviews: items });
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

    const cacheKey = `store:detail:${productId}`;
    const cachedResult = await cached(cacheKey, async () => {
      const product = await db.query.storeProducts.findFirst({
        where: eq(storeProducts.id, productId),
        with: {
          reviews: { orderBy: [desc(reviews.createdAt)], limit: 20 },
        },
      });
      if (!product) {
        throw new NotFoundError("产品");
      }
      return { product };
    }, 120);

    return c.json(cachedResult);
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

    // 语义检索路径：当 semantic=true 且 GLM_API_KEY 可用时，
    // 调用 GLM embedding-3 把 q 转为 1024 维向量，用 pgvector <=> 操作符做 cosine 相似度排序
    if (semantic) {
      const queryVector = await embedText(q);
      if (queryVector) {
        const vectorLiteral = toPgVectorLiteral(queryVector);
        // 用 raw SQL：drizzle 不直接暴露 pgvector 操作符
        // 1 - (embeddings <=> query) 将距离转相似度（0=完全相同, 2=完全相反）
        const semanticRows = await db.execute(sql`
          SELECT
            id, session_id, creator_id, name, description, icon, screenshots,
            tags, category, pricing_type, price, monthly_price, status, version,
            download_url, demo_url, api_endpoint, usage_count, rating, review_count,
            created_at, updated_at,
            1 - (embeddings <=> ${vectorLiteral}::vector) AS similarity
          FROM store_products
          WHERE status = 'PUBLISHED' AND embeddings IS NOT NULL
          ORDER BY embeddings <=> ${vectorLiteral}::vector
          LIMIT ${pageSize}
          OFFSET ${(page - 1) * pageSize}
        `);
        const semanticItems = semanticRows.rows ?? [];

        logger.info(
          { q, semantic: true, results: semanticItems.length, mode: "pgvector" },
          "商店语义检索",
        );

        return c.json({
          products: semanticItems,
          query: q,
          semantic: true,
          mode: "pgvector",
          page,
          pageSize,
          total: semanticItems.length,
        });
      }
      // 向量化失败 → 降级为全文搜索
      logger.warn({ q }, "语义检索降级：GLM API 不可用，回退关键词搜索");
    }

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

    logger.info(
      { q, semantic, results: items.length, mode: "keyword" },
      "商店搜索",
    );

    return c.json({
      products: items,
      query: q,
      semantic,
      mode: "keyword",
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

    if (!tx) throw new Error("创建交易失败");

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

    // 失效产品详情缓存（usageCount 已变化）
    await cacheInvalidatePattern(`store:detail:${productId}`);
    await cacheInvalidatePattern("store:list:*");

    // 记录 Prometheus 业务指标
    recordStorePurchase(product.pricingType === "SUBSCRIPTION" ? "SUBSCRIPTION" : "PURCHASE");

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

    if (!review) throw new Error("创建评价失败");

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

    // 失效产品详情缓存（评分与评价数已更新）
    await cacheInvalidatePattern(`store:detail:${productId}`);
    await cacheInvalidatePattern("store:list:*");

    return c.json({ review }, 201);
  },
);
