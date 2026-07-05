import {
  pgTable,
  text,
  timestamp,
  integer,
  numeric,
  jsonb,
  real,
  uuid,
  pgEnum,
  index,
  uniqueIndex,
  customType,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { buildSessions } from "./build-sessions";

/**
 * 自定义 pgvector 类型
 *
 * 用于 RAG 知识库 / 语义检索场景（见 §10.3）。
 * 需要 PostgreSQL 安装 pgvector 扩展：`CREATE EXTENSION IF NOT EXISTS vector;`
 *
 * 使用示例：
 * ```ts
 * // 指定维度（推荐，便于建立索引）
 * embeddings: vector("embeddings", { dimensions: 3072 })
 * // 不指定维度（灵活但无法建索引）
 * embeddings: vector("embeddings")
 * ```
 */
export const vector = customType<{
  data: string;
  driverData: string;
  config?: { dimensions: number };
}>({
  dataType(config) {
    return config ? `vector(${config.dimensions})` : "vector";
  },
});

/**
 * 商店分类枚举
 *
 * - SOCIAL / SYSTEM / WORKSTATION / DATA / ADMIN / APP / MARKETING / HARDWARE: 与 ProductType 对应
 * - AGENT: AI Agent 产品
 * - WORKFLOW: 工作流产品
 */
export const storeCategoryEnum = pgEnum("store_category", [
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
]);

/**
 * 定价类型枚举
 *
 * - FREE: 开源免费
 * - PAY_PER_USE: 按次付费
 * - SUBSCRIPTION: 订阅制
 * - EXCHANGE: 技能交换
 * - ENTERPRISE: 企业授权
 */
export const pricingTypeEnum = pgEnum("pricing_type", [
  "FREE",
  "PAY_PER_USE",
  "SUBSCRIPTION",
  "EXCHANGE",
  "ENTERPRISE",
]);

/**
 * 商店产品状态枚举
 *
 * - DRAFT: 草稿
 * - PENDING_REVIEW: 待审核
 * - PUBLISHED: 已发布
 * - REJECTED: 已拒绝
 * - SUSPENDED: 已下架
 */
export const storeStatusEnum = pgEnum("store_status", [
  "DRAFT",
  "PENDING_REVIEW",
  "PUBLISHED",
  "REJECTED",
  "SUSPENDED",
]);

/**
 * 交易类型枚举
 *
 * - PURCHASE: 单次购买
 * - SUBSCRIPTION: 订阅
 * - API_CALL: API 调用计费
 * - EXCHANGE: 技能交换
 */
export const transactionTypeEnum = pgEnum("transaction_type", [
  "PURCHASE",
  "SUBSCRIPTION",
  "API_CALL",
  "EXCHANGE",
]);

/**
 * 交易状态枚举
 *
 * - PENDING: 待支付
 * - COMPLETED: 已完成
 * - REFUNDED: 已退款
 * - FAILED: 失败
 */
export const transactionStatusEnum = pgEnum("transaction_status", [
  "PENDING",
  "COMPLETED",
  "REFUNDED",
  "FAILED",
]);

/**
 * 商店产品表（store_products）
 *
 * 上架到 AI 应用商店的产品（见 §2.4），由构建会话发布而来。
 * 包含元数据、定价、版本与统计信息。
 *
 * 外键：session_id -> build_sessions.id（唯一），creator_id -> users.id
 * RLS 策略：已发布产品公开可读；草稿 / 待审核仅创作者可见。
 */
export const storeProducts = pgTable(
  "store_products",
  {
    /** 产品唯一标识（UUID，数据库自动生成） */
    id: uuid("id").defaultRandom().primaryKey(),
    /** 关联的构建会话 ID（外键 -> build_sessions.id，唯一） */
    sessionId: uuid("session_id")
      .notNull()
      .unique()
      .references(() => buildSessions.id),
    /** 创作者用户 ID（外键 -> users.id） */
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => users.id),
    /** 产品名称 */
    name: text("name").notNull(),
    /** 产品描述 */
    description: text("description").notNull(),
    /** 产品图标 URL（可选） */
    icon: text("icon"),
    /** 产品截图 URL 数组 */
    screenshots: text("screenshots").array().notNull().default([]),
    /** 产品标签数组 */
    tags: text("tags").array().notNull().default([]),
    /** 商店分类 */
    category: storeCategoryEnum("category").notNull(),
    /** 定价类型 */
    pricingType: pricingTypeEnum("pricing_type").notNull(),
    /** 单次价格（Decimal 10,2，可选；PAY_PER_USE 时使用） */
    price: numeric("price", { precision: 10, scale: 2 }),
    /** 月订阅价格（Decimal 10,2，可选；SUBSCRIPTION 时使用） */
    monthlyPrice: numeric("monthly_price", { precision: 10, scale: 2 }),
    /** 产品状态，默认 DRAFT */
    status: storeStatusEnum("status").notNull().default("DRAFT"),
    /** 产品版本号字符串，默认 "1.0.0" */
    version: text("version").notNull().default("1.0.0"),
    /** 下载地址（可选） */
    downloadUrl: text("download_url"),
    /** 在线试用地址（可选） */
    demoUrl: text("demo_url"),
    /** API 调用地址（可选，用于 API_CALL 类型计费） */
    apiEndpoint: text("api_endpoint"),
    /** 使用次数统计，默认 0 */
    usageCount: integer("usage_count").notNull().default(0),
    /** 平均评分（1-5），默认 0 */
    rating: real("rating").notNull().default(0),
    /** 评价数量，默认 0 */
    reviewCount: integer("review_count").notNull().default(0),
    /**
     * 产品语义向量（pgvector，1024 维，对应智谱 GLM embedding-3 默认维度）
     * 用于商店语义搜索：cosine 相似度检索。
     * 需要 PostgreSQL 安装 pgvector 扩展：`CREATE EXTENSION IF NOT EXISTS vector;`
     * 可选字段，由 publish-service 在上架时异步调用 embedding API 生成。
     */
    embeddings: vector("embeddings", { dimensions: 1024 }),
    /** 创建时间（带时区） */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    /** 更新时间（带时区，自动更新） */
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    /** 创作者 ID 索引（创作者中心查询） */
    creatorIdIdx: index("store_products_creator_id_idx").on(table.creatorId),
    /** 分类索引（按分类浏览） */
    categoryIdx: index("store_products_category_idx").on(table.category),
    /** 状态索引（按状态筛选） */
    statusIdx: index("store_products_status_idx").on(table.status),
    /** 复合索引：状态 + 创建时间（商店首页分页） */
    statusCreatedIdx: index("store_products_status_created_idx").on(
      table.status,
      table.createdAt,
    ),
    // 注意：embeddings 字段的 pgvector IVFFlat 索引由迁移脚本 0005_add_indexes.sql
    // 手动创建（Drizzle ORM 不直接支持 pgvector 索引类型）
  }),
);

/**
 * 交易表（transactions）
 *
 * 商店交易记录（购买 / 订阅 / API 调用 / 技能交换），
 * 含平台抽成与创作者收益拆分（见 §2.4）。
 *
 * 外键：product_id -> store_products.id，buyer_id -> users.id
 * RLS 策略：买家可见自己的交易；卖家可见自己产品的交易。
 */
export const transactions = pgTable(
  "transactions",
  {
    /** 交易唯一标识（UUID，数据库自动生成） */
    id: uuid("id").defaultRandom().primaryKey(),
    /** 产品 ID（外键 -> store_products.id） */
    productId: uuid("product_id")
      .notNull()
      .references(() => storeProducts.id),
    /** 买家用户 ID（外键 -> users.id） */
    buyerId: uuid("buyer_id")
      .notNull()
      .references(() => users.id),
    /** 卖家用户 ID（冗余存储，外键 -> users.id） */
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => users.id),
    /** 交易类型 */
    type: transactionTypeEnum("type").notNull(),
    /** 交易金额（Decimal 10,2） */
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    /** 平台抽成（Decimal 10,2） */
    platformFee: numeric("platform_fee", { precision: 10, scale: 2 }).notNull(),
    /** 创作者收益（Decimal 10,2） */
    sellerRevenue: numeric("seller_revenue", { precision: 10, scale: 2 }).notNull(),
    /** 交易状态，默认 PENDING */
    status: transactionStatusEnum("status").notNull().default("PENDING"),
    /** 创建时间（带时区） */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    /** 完成时间（可选，带时区） */
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => ({
    /** 产品 ID 索引（查询产品的所有交易） */
    productIdIdx: index("transactions_product_id_idx").on(table.productId),
    /** 买家 ID 索引（查询买家的所有交易） */
    buyerIdIdx: index("transactions_buyer_id_idx").on(table.buyerId),
    /** 复合索引：买家 + 状态 + 创建时间（买家订单分页） */
    buyerStatusCreatedIdx: index("transactions_buyer_status_created_idx").on(
      table.buyerId,
      table.status,
      table.createdAt,
    ),
    /** 卖家 ID 索引（创作者查询自己的销售记录） */
    sellerIdIdx: index("transactions_seller_id_idx").on(table.sellerId),
    /** 复合索引：卖家 + 状态 + 创建时间（创作者销售订单分页） */
    sellerStatusCreatedIdx: index("transactions_seller_status_created_idx").on(
      table.sellerId,
      table.status,
      table.createdAt,
    ),
  }),
);

/**
 * 产品评价表（reviews）
 *
 * 用户对商店产品的评分与评论（1-5 分）。
 *
 * 外键：product_id -> store_products.id，user_id -> users.id
 * RLS 策略：已发布产品的评价公开可读；用户仅能写自己的评价。
 */
export const reviews = pgTable(
  "reviews",
  {
    /** 评价唯一标识（UUID，数据库自动生成） */
    id: uuid("id").defaultRandom().primaryKey(),
    /** 产品 ID（外键 -> store_products.id） */
    productId: uuid("product_id")
      .notNull()
      .references(() => storeProducts.id),
    /** 评价用户 ID（外键 -> users.id） */
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    /** 评分（1-5） */
    rating: integer("rating").notNull(),
    /** 评价内容（可选） */
    content: text("content"),
    /** 创建时间（带时区） */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    /** 更新时间（带时区，自动更新） */
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    /** 产品 ID 索引（查询产品的所有评价） */
    productIdIdx: index("reviews_product_id_idx").on(table.productId),
    /** 产品 + 用户唯一索引（每个用户对每个产品仅能评价一次） */
    productUserIdx: uniqueIndex("reviews_product_user_idx").on(table.productId, table.userId),
  }),
);
