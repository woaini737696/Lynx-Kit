/**
 * Prisma Client 单例
 *
 * 业务方接入时需：
 *   1. 安装 @prisma/client 及 prisma CLI
 *   2. 在 schema.prisma 中配置 datasource（postgres）
 *   3. 执行 prisma generate
 *
 * 这里仅提供单例创建占位
 */

import type { PrismaClient } from "@prisma/client";

// 防止开发模式下 HMR 重复创建 PrismaClient 实例
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  // 占位：实际项目中通过 new PrismaClient({ log: ["error"] }) 创建
  ({} as PrismaClient);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
