import { drizzle as neonDrizzle, type NeonDatabase } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { drizzle as pgDrizzle, type NodePostgresDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * 创建数据库连接的环境参数。
 */
export interface CreateDbEnv {
  /** PostgreSQL 连接字符串（本地 PG 或 Neon serverless） */
  url: string;
  /**
   * 可选：显式指定驱动类型。
   * - "neon"：使用 @neondatabase/serverless HTTP 驱动（适用于 Vercel / Cloudflare Workers）
   * - "pg"：使用 node-postgres Pool（适用于本地 / 自建 / 长连接服务）
   * - 未指定：根据 url 自动判断（含 neon.tech 即用 Neon 驱动）
   */
  driver?: "neon" | "pg";
}

/**
 * 数据库实例类型（Neon HTTP 与 node-postgres 的联合类型）。
 *
 * 两种驱动共享相同的 Drizzle 查询构建器 API，可在业务代码中无差别使用：
 * ```ts
 * const db = createDb({ url: process.env.DATABASE_URL! });
 * const user = await db.query.users.findFirst({ with: { servers: true } });
 * ```
 */
export type Database = NeonDatabase<typeof schema> | NodePostgresDatabase<typeof schema>;

/**
 * 判断连接字符串是否指向 Neon serverless。
 *
 * - host 包含 neon.tech
 * - scheme 为 neon:// 或 neon-http://
 */
function isNeonUrl(url: string): boolean {
  return (
    url.includes("neon.tech") ||
    url.startsWith("neon://") ||
    url.startsWith("neon-http://")
  );
}

/**
 * 数据库客户端工厂。
 *
 * 根据连接字符串自动选择驱动：
 * - Neon serverless（含 neon.tech）→ @neondatabase/serverless HTTP 驱动
 * - 本地 / 自建 PostgreSQL → node-postgres Pool（长连接）
 *
 * 两种驱动共享同一份 schema 与查询 API，业务代码无需关心具体驱动。
 *
 * @param env 连接环境
 * @returns Drizzle 数据库实例（已注册 schema，支持 db.query 关系查询）
 *
 * @example
 * ```ts
 * import { createDb } from "@lynxkit/db";
 *
 * // 本地开发
 * const db = createDb({ url: "postgresql://postgres:postgres@localhost:5432/lynxkit" });
 *
 * // Neon serverless（Vercel 部署）
 * const db = createDb({ url: process.env.DATABASE_URL! });
 * ```
 */
export function createDb(env: CreateDbEnv): Database {
  const useNeon = env.driver === "neon" || (env.driver === undefined && isNeonUrl(env.url));

  if (useNeon) {
    const sql = neon(env.url);
    return neonDrizzle(sql, { schema });
  }

  const pool = new Pool({ connectionString: env.url });
  return pgDrizzle(pool, { schema });
}
