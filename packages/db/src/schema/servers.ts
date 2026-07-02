import { pgTable, text, timestamp, integer, boolean, uuid, index, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * 服务器状态枚举
 *
 * - PENDING: 待连接验证
 * - CONNECTED: 已连接
 * - DOCKER_READY: Docker 就绪
 * - ERROR: 异常
 */
export const serverStatusEnum = pgEnum("server_status", [
  "PENDING",
  "CONNECTED",
  "DOCKER_READY",
  "ERROR",
]);

/**
 * 用户服务器表（servers）
 *
 * 存储用户自有服务器的 SSH 连接信息。
 * SSH 密码 / 密钥均经过 AES-256-GCM 加密后存储（见 §9.1）。
 *
 * 外键：user_id -> users.id（级联删除）
 * RLS 策略：用户仅能访问 user_id = current_setting('app.user_id') 的记录。
 */
export const servers = pgTable(
  "servers",
  {
    /** 服务器唯一标识（UUID，数据库自动生成） */
    id: uuid("id").defaultRandom().primaryKey(),
    /** 所属用户 ID（外键 -> users.id，级联删除） */
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** 服务器名称（用户自定义） */
    name: text("name").notNull(),
    /** 服务器 IP 地址 */
    ip: text("ip").notNull(),
    /** SSH 端口，默认 22 */
    port: integer("port").notNull().default(22),
    /** SSH 登录用户名 */
    username: text("username").notNull(),
    /** KMS 加密后的密码（AES-256-GCM） */
    encryptedPassword: text("encrypted_password").notNull(),
    /** 可选 SSH 密钥（加密存储） */
    sshKey: text("ssh_key"),
    /** 服务器状态，默认 PENDING */
    status: serverStatusEnum("status").notNull().default("PENDING"),
    /** Docker 是否就绪 */
    dockerReady: boolean("docker_ready").notNull().default(false),
    /** Caddy 是否就绪 */
    caddyReady: boolean("caddy_ready").notNull().default(false),
    /** 最近一次连接时间（可选） */
    lastConnectedAt: timestamp("last_connected_at", { withTimezone: true }),
    /** 创建时间（带时区） */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    /** 更新时间（带时区，自动更新） */
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    /** 用户 ID 索引（查询用户的所有服务器） */
    userIdIdx: index("servers_user_id_idx").on(table.userId),
  }),
);
