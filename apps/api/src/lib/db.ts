/**
 * Drizzle 数据库客户端单例 - LynxKit API
 *
 * 委托给 @lynxkit/db 的 createDb 工厂：
 *   - Neon serverless（含 neon.tech）→ @neondatabase/serverless HTTP 驱动
 *   - 本地 / 自建 PostgreSQL → node-postgres Pool（长连接）
 *
 * 全局复用同一连接，避免每次请求新建 Pool。
 */
import { createDb, type Database } from "@lynxkit/db";

import { env } from "../env.js";
import { logger } from "./logger.js";

let dbInstance: Database | null = null;

/**
 * 获取 Drizzle 数据库单例。
 *
 * 首次调用时根据 DATABASE_URL 创建连接并缓存；
 * 后续调用直接返回缓存实例。
 *
 * @returns Drizzle Database 实例（已注册 schema，支持 db.query 关系查询）
 */
export function getDb(): Database {
  if (!dbInstance) {
    dbInstance = createDb({ url: env.DATABASE_URL });
    logger.info({ url: maskUrl(env.DATABASE_URL) }, "数据库连接已建立");
  }
  return dbInstance;
}

/**
 * 屏蔽连接字符串中的密码，仅用于日志输出。
 */
function maskUrl(url: string): string {
  return url.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@");
}

/**
 * 数据库实例（懒初始化的快捷访问）。
 *
 * 注意：直接在模块顶层调用 getDb() 会在 import 时即建立连接，
 * 测试场景下可能不希望如此。生产环境推荐使用 getDb() 显式获取。
 */
export const db: Database = new Proxy({} as Database, {
  get(_target, prop) {
    return Reflect.get(getDb() as object, prop);
  },
});
