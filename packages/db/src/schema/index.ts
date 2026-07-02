import { relations } from "drizzle-orm";

// ===== 表与枚举导出 =====

// 用户模块
export { users, userRoleEnum, userStatusEnum } from "./users";

// 服务器模块
export { servers, serverStatusEnum } from "./servers";

// 构建会话模块
export {
  buildSessions,
  buildLogs,
  buildVersions,
  productTypeEnum,
  buildStatusEnum,
  logLevelEnum,
} from "./build-sessions";

// 商店模块
export {
  storeProducts,
  transactions,
  reviews,
  storeCategoryEnum,
  pricingTypeEnum,
  storeStatusEnum,
  transactionTypeEnum,
  transactionStatusEnum,
  vector,
} from "./store";

// 创作者模块
export { creatorProfiles } from "./creators";

// 系统模块
export { systemConfigs, templates } from "./system";

// ===== 关系定义（用于 db.query 关系查询 API） =====

import { users } from "./users";
import { servers } from "./servers";
import { buildSessions, buildLogs, buildVersions } from "./build-sessions";
import { storeProducts, transactions, reviews } from "./store";
import { creatorProfiles } from "./creators";
import { systemConfigs, templates } from "./system";

/**
 * users 关系：一个用户拥有多个服务器 / 构建会话 / 商店产品 / 评价，
 * 以及一个可选的创作者档案。
 *
 * 注意：transactions 表同时包含 buyer_id 与 seller_id 两个指向 users 的外键，
 * 因此需要用 relationName 拆分为 transactionsAsBuyer / transactionsAsSeller。
 */
export const usersRelations = relations(users, ({ many, one }) => ({
  servers: many(servers),
  buildSessions: many(buildSessions),
  storeProducts: many(storeProducts, { relationName: "storeProductsCreator" }),
  /** 用户作为买家的交易 */
  transactionsAsBuyer: many(transactions, { relationName: "transactionsBuyer" }),
  /** 用户作为卖家的交易 */
  transactionsAsSeller: many(transactions, { relationName: "transactionsSeller" }),
  reviews: many(reviews, { relationName: "reviewsUser" }),
  creatorProfile: one(creatorProfiles),
}));

/**
 * servers 关系：属于一个用户，拥有多个构建会话。
 */
export const serversRelations = relations(servers, ({ one, many }) => ({
  user: one(users, { fields: [servers.userId], references: [users.id] }),
  buildSessions: many(buildSessions),
}));

/**
 * build_sessions 关系：属于用户与可选服务器，拥有多个日志 / 版本，
 * 以及一个可选的商店产品（1:1）。
 */
export const buildSessionsRelations = relations(buildSessions, ({ one, many }) => ({
  user: one(users, { fields: [buildSessions.userId], references: [users.id] }),
  server: one(servers, { fields: [buildSessions.serverId], references: [servers.id] }),
  logs: many(buildLogs),
  versions: many(buildVersions),
  storeProduct: one(storeProducts),
}));

/**
 * build_logs 关系：属于一个构建会话。
 */
export const buildLogsRelations = relations(buildLogs, ({ one }) => ({
  session: one(buildSessions, {
    fields: [buildLogs.sessionId],
    references: [buildSessions.id],
  }),
}));

/**
 * build_versions 关系：属于一个构建会话。
 */
export const buildVersionsRelations = relations(buildVersions, ({ one }) => ({
  session: one(buildSessions, {
    fields: [buildVersions.sessionId],
    references: [buildSessions.id],
  }),
}));

/**
 * store_products 关系：关联构建会话（1:1）与创作者，拥有多个交易 / 评价。
 */
export const storeProductsRelations = relations(storeProducts, ({ one, many }) => ({
  session: one(buildSessions, {
    fields: [storeProducts.sessionId],
    references: [buildSessions.id],
  }),
  creator: one(users, {
    fields: [storeProducts.creatorId],
    references: [users.id],
    relationName: "storeProductsCreator",
  }),
  transactions: many(transactions),
  reviews: many(reviews),
}));

/**
 * transactions 关系：属于一个产品，以及买家和卖家两个用户。
 */
export const transactionsRelations = relations(transactions, ({ one }) => ({
  product: one(storeProducts, {
    fields: [transactions.productId],
    references: [storeProducts.id],
  }),
  buyer: one(users, {
    fields: [transactions.buyerId],
    references: [users.id],
    relationName: "transactionsBuyer",
  }),
  seller: one(users, {
    fields: [transactions.sellerId],
    references: [users.id],
    relationName: "transactionsSeller",
  }),
}));

/**
 * reviews 关系：属于一个产品与一个用户。
 */
export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(storeProducts, {
    fields: [reviews.productId],
    references: [storeProducts.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
    relationName: "reviewsUser",
  }),
}));

/**
 * creator_profiles 关系：属于一个用户（1:1）。
 */
export const creatorProfilesRelations = relations(creatorProfiles, ({ one }) => ({
  user: one(users, {
    fields: [creatorProfiles.userId],
    references: [users.id],
  }),
}));

/**
 * 完整 schema 对象（用于 drizzle 客户端 schema 注册与 db.query API）。
 *
 * 使用：
 * ```ts
 * import { createDb, schema } from "@lynxkit/db";
 * const db = createDb({ url: process.env.DATABASE_URL! });
 * const user = await db.query.users.findFirst({ with: { servers: true } });
 * ```
 */
export const schema = {
  users,
  servers,
  buildSessions,
  buildLogs,
  buildVersions,
  storeProducts,
  transactions,
  reviews,
  creatorProfiles,
  systemConfigs,
  templates,
  usersRelations,
  serversRelations,
  buildSessionsRelations,
  buildLogsRelations,
  buildVersionsRelations,
  storeProductsRelations,
  transactionsRelations,
  reviewsRelations,
  creatorProfilesRelations,
};

export type Schema = typeof schema;
