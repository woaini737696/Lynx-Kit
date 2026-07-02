import { pgTable, text, timestamp, boolean, uuid, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { productTypeEnum } from "./build-sessions";

/**
 * 系统配置表（system_configs）
 *
 * 平台级键值配置存储（如抽成比例、默认限额等）。
 * 使用 JSONB 存储复杂结构化值。
 *
 * RLS 策略：仅管理员可读写；部分公开配置对所有用户可读。
 */
export const systemConfigs = pgTable(
  "system_configs",
  {
    /** 配置唯一标识（UUID，数据库自动生成） */
    id: uuid("id").defaultRandom().primaryKey(),
    /** 配置键（全局唯一，如 platform.fee.rate） */
    key: text("key").notNull(),
    /** 配置值（JSONB，支持复杂结构） */
    value: jsonb("value").notNull(),
    /** 更新时间（带时区，自动更新） */
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    /** 配置键唯一索引 */
    keyIdx: uniqueIndex("system_configs_key_idx").on(table.key),
  }),
).enableRLS();

/**
 * 架构模板表（templates）
 *
 * 每个产品类型对应的预验证架构模板（见 §2.2），包含技术栈、
 * 目录结构、需求澄清问题配置、配置映射规则等。
 * 与 packages/templates/<type>/template.json 对应。
 *
 * 外键：无（type 字段与 ProductType 枚举对应，但不做外键约束）
 * RLS 策略：所有模板对所有用户只读；仅管理员可写。
 */
export const templates = pgTable(
  "templates",
  {
    /** 模板唯一标识（UUID，数据库自动生成） */
    id: uuid("id").defaultRandom().primaryKey(),
    /** 模板类型（对应 ProductType 枚举，唯一） */
    type: productTypeEnum("type").notNull(),
    /** 模板名称 */
    name: text("name").notNull(),
    /** 模板描述 */
    description: text("description").notNull(),
    /** 模板版本号，默认 "1.0.0" */
    version: text("version").notNull().default("1.0.0"),
    /** 需求澄清问题配置 JSON（动态问题列表） */
    questions: jsonb("questions").notNull(),
    /** 配置映射规则 JSON（问题答案 -> 模板变量） */
    configMap: jsonb("config_map").notNull(),
    /** 模板基座路径（相对 packages/templates 根目录） */
    basePath: text("base_path").notNull(),
    /** 是否启用，默认 true */
    isActive: boolean("is_active").notNull().default(true),
    /** 创建时间（带时区） */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    /** 更新时间（带时区，自动更新） */
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    /** 模板类型唯一索引（每个 ProductType 仅一个模板） */
    typeIdx: uniqueIndex("templates_type_idx").on(table.type),
  }),
).enableRLS();
