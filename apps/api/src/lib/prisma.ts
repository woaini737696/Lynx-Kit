/**
 * Prisma Client 单例
 *
 * 防止 Fastify 热重载（tsx watch）创建多个连接，
 * 避免数据库连接耗尽。
 */
import { PrismaClient } from "@prisma/client";

import { logger } from "./logger.js";

declare global {
  // eslint-disable-next-line no-var
  var __lynxkitPrisma:
    | PrismaClient
    | undefined;
}

/**
 * 获取全局共享的 PrismaClient 实例
 */
export function getPrisma(): PrismaClient {
  if (globalThis.__lynxkitPrisma) {
    return globalThis.__lynxkitPrisma;
  }

  const prisma = new PrismaClient({
    log: [
      { emit: "event", level: "query" },
      { emit: "event", level: "error" },
      { emit: "event", level: "warn" },
    ],
  });

  // 仅在开发环境记录 SQL 查询
  if (process.env.NODE_ENV !== "production") {
    prisma.$on("query", (e) => {
      logger.debug(
        { query: e.query, params: e.params, duration: e.duration },
        "Prisma query"
      );
    });
  }

  prisma.$on("error", (e) => {
    logger.error({ err: e }, "Prisma error");
  });

  prisma.$on("warn", (e) => {
    logger.warn({ msg: e.message }, "Prisma warning");
  });

  globalThis.__lynxkitPrisma = prisma;
  return prisma;
}

export const prisma = getPrisma();
