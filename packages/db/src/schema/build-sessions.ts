import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  uuid,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { servers } from "./servers";

/**
 * 产品类型枚举
 *
 * 平台预设 8 大产品类型，覆盖 90% 的 AI 产品需求（见 §2.1）。
 *
 * - SOCIAL: AI 社交产品
 * - SYSTEM: AI 系统平台
 * - WORKSTATION: AI 工作站
 * - DATA: AI 数据分析
 * - ADMIN: AI 管理后台
 * - APP: AI 应用 App
 * - MARKETING: AI 广告营销
 * - HARDWARE: AI 硬件集成
 */
export const productTypeEnum = pgEnum("product_type", [
  "SOCIAL",
  "SYSTEM",
  "WORKSTATION",
  "DATA",
  "ADMIN",
  "APP",
  "MARKETING",
  "HARDWARE",
]);

/**
 * 构建状态枚举（见 §4.1 BuildStatus）
 *
 * - DRAFT: 草稿
 * - CLARIFYING: 需求澄清中
 * - ARCHITECTING: 架构设计中
 * - DEVELOPING: 开发中
 * - TESTING: 测试中
 * - DEPLOYING: 部署中
 * - DEPLOYED: 已部署
 * - ERROR: 失败
 */
export const buildStatusEnum = pgEnum("build_status", [
  "DRAFT",
  "CLARIFYING",
  "ARCHITECTING",
  "DEVELOPING",
  "TESTING",
  "DEPLOYING",
  "DEPLOYED",
  "ERROR",
]);

/**
 * 日志级别枚举
 *
 * - INFO: 常规信息
 * - WARN: 警告
 * - ERROR: 错误
 * - DEBUG: 调试
 */
export const logLevelEnum = pgEnum("log_level", [
  "INFO",
  "WARN",
  "ERROR",
  "DEBUG",
]);

/**
 * 构建会话表（build_sessions）
 *
 * 一次完整的产品构建过程（见 §2.3）：用户输入需求 → 意图识别 → 架构选择 →
 * 需求澄清 → Agent 开发 → 测试 → 部署 → 上架。
 * 每个会话支持断点续传与版本回滚。
 *
 * 外键：user_id -> users.id（级联删除），server_id -> servers.id（无级联）
 * RLS 策略：用户仅能访问 user_id = current_setting('app.user_id') 的记录。
 */
export const buildSessions = pgTable(
  "build_sessions",
  {
    /** 会话唯一标识（UUID，数据库自动生成） */
    id: uuid("id").defaultRandom().primaryKey(),
    /** 所属用户 ID（外键 -> users.id，级联删除） */
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** 目标部署服务器 ID（可选，外键 -> servers.id） */
    serverId: uuid("server_id").references(() => servers.id),
    /** 会话名称 */
    name: text("name").notNull(),
    /** 需求描述（可选） */
    description: text("description"),
    /** 产品类型 */
    productType: productTypeEnum("product_type").notNull(),
    /** 构建状态，默认 DRAFT */
    status: buildStatusEnum("status").notNull().default("DRAFT"),
    /** 用户配置 JSON（需求澄清后的结构化答案），默认空对象 */
    config: jsonb("config").notNull().default({}),
    /** 架构方案 JSON（架构师 Agent 产出，可选） */
    architecture: jsonb("architecture"),
    /** 生成的代码包 JSON（开发 Agent 产出，可选） */
    generatedCode: jsonb("generated_code"),
    /** 部署后的访问 URL（可选） */
    deployUrl: text("deploy_url"),
    /** 用户自定义域名（可选） */
    customDomain: text("custom_domain"),
    /** 版本号（每次部署自增） */
    version: integer("version").notNull().default(1),
    /** 创建时间（带时区） */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    /** 更新时间（带时区，自动更新） */
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    /** 用户 ID 索引（查询用户的所有会话） */
    userIdIdx: index("build_sessions_user_id_idx").on(table.userId),
    /** 状态索引（按状态筛选会话） */
    statusIdx: index("build_sessions_status_idx").on(table.status),
    /** 复合索引：用户 + 状态 + 创建时间（高频分页查询） */
    userStatusCreatedIdx: index("build_sessions_user_status_created_idx").on(
      table.userId,
      table.status,
      table.createdAt,
    ),
  }),
).enableRLS();

/**
 * 构建日志表（build_logs）
 *
 * 每个 Agent 执行过程中产生的日志，用于调试与展示开发进度。
 *
 * 外键：session_id -> build_sessions.id（级联删除）
 * RLS 策略：通过 session_id 间接关联用户权限。
 */
export const buildLogs = pgTable(
  "build_logs",
  {
    /** 日志唯一标识（UUID，数据库自动生成） */
    id: uuid("id").defaultRandom().primaryKey(),
    /** 所属构建会话 ID（外键 -> build_sessions.id，级联删除） */
    sessionId: uuid("session_id")
      .notNull()
      .references(() => buildSessions.id, { onDelete: "cascade" }),
    /** 产生日志的 Agent 名称（如 intent / architect / frontend） */
    agent: text("agent").notNull(),
    /** 日志级别 */
    level: logLevelEnum("level").notNull(),
    /** 日志消息内容 */
    message: text("message").notNull(),
    /** 额外元信息 JSON（可选，如耗时、token 数） */
    metadata: jsonb("metadata"),
    /** 创建时间（带时区） */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    /** 会话 ID 索引（查询会话的所有日志） */
    sessionIdIdx: index("build_logs_session_id_idx").on(table.sessionId),
  }),
).enableRLS();

/**
 * 构建版本表（build_versions）
 *
 * 每次部署生成一个版本快照，用于版本回滚（见 §5.2 rollback 接口）。
 *
 * 外键：session_id -> build_sessions.id（级联删除）
 * RLS 策略：通过 session_id 间接关联用户权限。
 */
export const buildVersions = pgTable(
  "build_versions",
  {
    /** 版本唯一标识（UUID，数据库自动生成） */
    id: uuid("id").defaultRandom().primaryKey(),
    /** 所属构建会话 ID（外键 -> build_sessions.id，级联删除） */
    sessionId: uuid("session_id")
      .notNull()
      .references(() => buildSessions.id, { onDelete: "cascade" }),
    /** 版本号 */
    version: integer("version").notNull(),
    /** 该版本对应的配置 JSON 快照 */
    config: jsonb("config").notNull(),
    /** 代码包哈希（用于校验和回滚） */
    codeHash: text("code_hash").notNull(),
    /** 版本状态：success / failed */
    status: text("status").notNull(),
    /** 创建时间（带时区） */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    /** 会话 ID 索引（查询会话的所有版本） */
    sessionIdIdx: index("build_versions_session_id_idx").on(table.sessionId),
    /** 会话 + 版本号唯一索引（防止同会话重复版本号） */
    sessionVersionIdx: uniqueIndex("build_versions_session_version_idx").on(
      table.sessionId,
      table.version,
    ),
  }),
).enableRLS();
