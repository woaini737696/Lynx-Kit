/**
 * @lynxkit/db
 *
 * LynxKit 平台数据库层入口。
 *
 * 导出：
 * - Drizzle schema（11 张表 + 枚举 + 关系）
 * - 客户端工厂 `createDb`（支持 Neon serverless 与本地 PG）
 * - pgvector 自定义类型 `vector`
 * - `schema` 聚合对象（用于 drizzle 客户端注册）
 */

// ===== Schema 导出（表、枚举、关系、vector 类型、schema 聚合对象） =====
export * from "./schema/index.js";

// ===== 客户端工厂导出 =====
export { createDb, type Database, type CreateDbEnv } from "./client";
