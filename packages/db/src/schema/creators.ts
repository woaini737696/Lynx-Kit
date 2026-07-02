import { pgTable, text, timestamp, uuid, integer, numeric, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * 创作者档案表（creator_profiles）
 *
 * 开通创作者中心的用户档案（见 §2.4），与 users 一对一关联。
 * 存储创作者的对外展示信息与累计统计。
 *
 * 外键：user_id -> users.id（唯一，级联删除）
 * RLS 策略：创作者可读写自身档案；公开字段对外可读。
 */
export const creatorProfiles = pgTable(
  "creator_profiles",
  {
    /** 档案唯一标识（UUID，数据库自动生成） */
    id: uuid("id").defaultRandom().primaryKey(),
    /** 关联用户 ID（外键 -> users.id，唯一，级联删除） */
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    /** 创作者简介（可选） */
    bio: text("bio"),
    /** 个人网站（可选） */
    website: text("website"),
    /** GitHub 主页（可选） */
    github: text("github"),
    /** Twitter 主页（可选） */
    twitter: text("twitter"),
    /** 累计收益（Decimal 10,2，默认 0） */
    totalRevenue: numeric("total_revenue", { precision: 10, scale: 2 }).notNull().default("0"),
    /** 累计产品数，默认 0 */
    totalProducts: integer("total_products").notNull().default(0),
    /** 累计用户数，默认 0 */
    totalUsers: integer("total_users").notNull().default(0),
    /** 创建时间（带时区） */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    /** 更新时间（带时区，自动更新） */
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    /** 用户 ID 唯一索引（一对一关系） */
    userIdIdx: uniqueIndex("creator_profiles_user_id_idx").on(table.userId),
  }),
).enableRLS();
