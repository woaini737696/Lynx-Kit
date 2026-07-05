import { pgTable, text, timestamp, uuid, pgEnum, integer, numeric, boolean, index, uniqueIndex, jsonb } from "drizzle-orm/pg-core";

/**
 * 会员档位枚举
 *
 * - FREE: 免费会员
 * - LITE: Lite 会员（¥49/月）
 * - PRO: Pro 会员（¥129/月）
 * - MAX: Max 会员（¥239/月）
 */
export const membershipTierEnum = pgEnum("membership_tier", [
  "FREE",
  "LITE",
  "PRO",
  "MAX",
]);

/**
 * 会员状态枚举
 *
 * - ACTIVE: 生效中
 * - EXPIRED: 已过期
 * - CANCELED: 已取消（不续费）
 * - SUSPENDED: 已暂停（违规冻结）
 */
export const membershipStatusEnum = pgEnum("membership_status", [
  "ACTIVE",
  "EXPIRED",
  "CANCELED",
  "SUSPENDED",
]);

/**
 * 会员开通来源枚举
 *
 * - MANUAL: 后台手动开通
 * - PAYMENT: 在线支付（预留）
 * - GIFT: 赠送活动
 * - TRIAL: 试用
 */
export const membershipSourceEnum = pgEnum("membership_source", [
  "MANUAL",
  "PAYMENT",
  "GIFT",
  "TRIAL",
]);

/**
 * S 币流水类型枚举
 *
 * - RECHARGE: 充值
 * - CONSUME: 消耗（Token 兑换）
 * - GRANT: 后台赠送
 * - REFUND: 退款
 * - EXCHANGE: Token 兑换（1 Token = 15 S 币）
 * - ADJUST: 后台调整
 */
export const sCoinTxTypeEnum = pgEnum("scoin_tx_type", [
  "RECHARGE",
  "CONSUME",
  "GRANT",
  "REFUND",
  "EXCHANGE",
  "ADJUST",
]);

/**
 * 会员档位表（membership_plans）
 *
 * 4 档会员的静态配置：FREE / LITE / PRO / MAX。
 * 由系统初始化时写入，运维可调整价格与权益参数。
 */
export const membershipPlans = pgTable(
  "membership_plans",
  {
    /** 唯一标识 */
    id: uuid("id").defaultRandom().primaryKey(),
    /** 档位标识（FREE/LITE/PRO/MAX） */
    tier: membershipTierEnum("tier").notNull().unique(),
    /** 显示名称 */
    name: text("name").notNull(),
    /** 月价格（元） */
    priceMonthly: numeric("price_monthly", { precision: 10, scale: 2 }).notNull().default("0"),
    /** 年价格（元） */
    priceYearly: numeric("price_yearly", { precision: 10, scale: 2 }).notNull().default("0"),
    /** 每月赠送 S 币数量 */
    monthlySCoinGrant: integer("monthly_scoin_grant").notNull().default(0),
    /** Token 兑换比例（1 Token = X S 币） */
    tokenToSCoinRate: integer("token_to_scoin_rate").notNull().default(15),
    /** 是否启用 */
    enabled: boolean("enabled").notNull().default(true),
    /** 显示顺序 */
    sortOrder: integer("sort_order").notNull().default(0),
    /** 权益配置（JSON：每日 Token 限额、模型白名单、功能开关等） */
    features: jsonb("features"),
    /** 创建时间 */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    /** 更新时间 */
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tierIdx: uniqueIndex("membership_plans_tier_idx").on(table.tier),
  }),
);

/**
 * 用户会员状态表（user_memberships）
 *
 * 记录用户当前/历史的会员状态。一个用户可有历史记录多条，但同一时间只允许一条 ACTIVE。
 */
export const userMemberships = pgTable(
  "user_memberships",
  {
    /** 唯一标识 */
    id: uuid("id").defaultRandom().primaryKey(),
    /** 用户 ID（外键 users.id） */
    userId: uuid("user_id").notNull(),
    /** 会员档位 */
    tier: membershipTierEnum("tier").notNull(),
    /** 状态 */
    status: membershipStatusEnum("status").notNull().default("ACTIVE"),
    /** 开通来源 */
    source: membershipSourceEnum("source").notNull().default("MANUAL"),
    /** 开通时长（月数） */
    durationMonths: integer("duration_months").notNull().default(1),
    /** 生效时间 */
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    /** 到期时间 */
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    /** 操作人 ID（手动开通时为管理员 ID） */
    operatorId: uuid("operator_id"),
    /** 备注 */
    note: text("note"),
    /** 创建时间 */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    /** 更新时间 */
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("user_memberships_user_id_idx").on(table.userId),
    statusIdx: index("user_memberships_status_idx").on(table.status),
    expiresIdx: index("user_memberships_expires_at_idx").on(table.expiresAt),
    /** 复合索引：用户 + 状态（查询用户当前 ACTIVE 会员高频） */
    userStatusIdx: index("user_memberships_user_status_idx").on(table.userId, table.status),
  }),
);

/**
 * S 币余额表（scoin_balances）
 *
 * 1:1 关联用户，记录当前可用余额与冻结余额。
 */
export const sCoinBalances = pgTable(
  "scoin_balances",
  {
    /** 用户 ID（外键 users.id，主键） */
    userId: uuid("user_id").primaryKey(),
    /** 可用余额 */
    balance: integer("balance").notNull().default(0),
    /** 冻结余额（预扣未结算） */
    frozenBalance: integer("frozen_balance").notNull().default(0),
    /** 累计获得 S 币 */
    totalGranted: integer("total_granted").notNull().default(0),
    /** 累计消耗 S 币 */
    totalConsumed: integer("total_consumed").notNull().default(0),
    /** 最后更新时间 */
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
);

/**
 * S 币流水表（scoin_transactions）
 *
 * 完整记录每笔 S 币变动，用于审计与对账。
 */
export const sCoinTransactions = pgTable(
  "scoin_transactions",
  {
    /** 唯一标识 */
    id: uuid("id").defaultRandom().primaryKey(),
    /** 用户 ID */
    userId: uuid("user_id").notNull(),
    /** 流水类型 */
    type: sCoinTxTypeEnum("type").notNull(),
    /** 变动数量（正数增加，负数减少） */
    delta: integer("delta").notNull(),
    /** 变动后余额 */
    balanceAfter: integer("balance_after").notNull(),
    /** 关联业务类型（subscription/build/payment/admin等） */
    refType: text("ref_type"),
    /** 关联业务 ID */
    refId: text("ref_id"),
    /** 操作人 ID（后台调整时） */
    operatorId: uuid("operator_id"),
    /** 备注 */
    note: text("note"),
    /** 创建时间 */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("scoin_tx_user_id_idx").on(table.userId),
    typeIdx: index("scoin_tx_type_idx").on(table.type),
    createdAtIdx: index("scoin_tx_created_at_idx").on(table.createdAt),
    /** 复合索引：用户 + 创建时间（用户 S 币流水分页查询） */
    userCreatedIdx: index("scoin_tx_user_created_idx").on(table.userId, table.createdAt),
  }),
);
