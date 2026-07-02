import { pgTable, text, timestamp, uuid, pgEnum, index, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * 用户角色枚举
 *
 * - USER: 普通用户
 * - CREATOR: 创作者（已开通创作者中心）
 * - ADMIN: 管理员
 * - SUPER_ADMIN: 超级管理员
 */
export const userRoleEnum = pgEnum("user_role", [
  "USER",
  "CREATOR",
  "ADMIN",
  "SUPER_ADMIN",
]);

/**
 * 用户状态枚举
 *
 * - ACTIVE: 正常
 * - SUSPENDED: 已封禁
 * - DELETED: 已注销
 */
export const userStatusEnum = pgEnum("user_status", [
  "ACTIVE",
  "SUSPENDED",
  "DELETED",
]);

/**
 * 平台用户表（users）
 *
 * 存储所有注册用户的基础信息、角色与状态。
 * 作为平台核心实体，被 servers / build_sessions / store_products 等多张表引用。
 *
 * RLS 策略：用户仅能读写自身记录（id = current_setting('app.user_id')）。
 */
export const users = pgTable(
  "users",
  {
    /** 用户唯一标识（UUID，数据库自动生成） */
    id: uuid("id").defaultRandom().primaryKey(),
    /** 登录邮箱（全局唯一） */
    email: text("email").notNull(),
    /** 显示名（可选） */
    name: text("name"),
    /** 头像 URL（可选） */
    avatar: text("avatar"),
    /** 手机号（可选，全局唯一） */
    phone: text("phone"),
    /** 关联的 Lynx AI 账户 ID（可选，全局唯一） */
    lynxAiId: text("lynx_ai_id"),
    /** 用户角色，默认 USER */
    role: userRoleEnum("role").notNull().default("USER"),
    /** 账号状态，默认 ACTIVE */
    status: userStatusEnum("status").notNull().default("ACTIVE"),
    /** 创建时间（带时区） */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    /** 更新时间（带时区，自动更新） */
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    /** 邮箱唯一索引 */
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
    /** 手机号唯一索引 */
    phoneIdx: uniqueIndex("users_phone_idx").on(table.phone),
    /** Lynx AI ID 唯一索引 */
    lynxAiIdIdx: uniqueIndex("users_lynx_ai_id_idx").on(table.lynxAiId),
    /** 用户 ID 索引（被外键引用） */
    idIdx: index("users_id_idx").on(table.id),
  }),
).enableRLS();
