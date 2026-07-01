/**
 * tRPC 上下文工厂
 *
 * 从 Fastify request 提取 Bearer token，验证后注入 user 到 ctx。
 * 同时注入 prisma / queue / kms 等依赖，便于 router 复用。
 */
import type { FastifyRequest } from "fastify";

import type { PrismaClient } from "@prisma/client";

import type { Queue } from "bullmq";

import { prisma } from "../lib/prisma.js";
import { verifyToken, extractBearerToken, type JwtPayload } from "../lib/jwt.js";
import { getKMS } from "../lib/crypto.js";
import type { KMS } from "@lynxkit/shared/crypto";
import {
  codeGenerationQueue,
  deploymentQueue,
  buildSandboxQueue,
  notificationsQueue,
} from "../lib/queue.js";

import { logger } from "../lib/logger.js";

/** 已认证用户信息（注入到 ctx.user） */
export interface ContextUser {
  id: string;
  email: string;
  role: string;
}

/** tRPC 上下文 */
export interface CreateContextOptions {
  /** 当前请求的 Fastify request */
  req?: FastifyRequest;
}

export interface Context {
  /** 已认证用户（未登录时为 null） */
  user: ContextUser | null;
  /** Prisma Client */
  prisma: PrismaClient;
  /** KMS 实例 */
  kms: KMS;
  /** 任务队列 */
  queues: {
    codeGeneration: Queue;
    deployment: Queue;
    buildSandbox: Queue;
    notifications: Queue;
  };
  /** 原始 Fastify request */
  req?: FastifyRequest;
}

/**
 * 从 Fastify request 中解析用户
 *
 * @param req Fastify request
 * @returns 解析失败返回 null，成功返回 ContextUser
 */
function resolveUserFromRequest(
  req?: FastifyRequest
): ContextUser | null {
  if (!req) return null;

  const authHeader = req.headers.authorization;
  const token = extractBearerToken(authHeader);
  if (!token) return null;

  try {
    const payload: JwtPayload = verifyToken(token);
    return {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  } catch (err) {
    logger.debug(
      { err: err instanceof Error ? err.message : String(err) },
      "JWT 验证失败（用户视为未登录）"
    );
    return null;
  }
}

/**
 * 创建 tRPC 上下文
 *
 * 用法：
 *   ```ts
 *   .mutation(async ({ input, ctx }) => {
 *     const user = ctx.user!; // protectedProcedure 保证非空
 *   });
 *   ```
 */
export async function createContext(
  opts: CreateContextOptions
): Promise<Context> {
  const user = resolveUserFromRequest(opts.req);

  return {
    user,
    prisma,
    kms: getKMS(),
    queues: {
      codeGeneration: codeGenerationQueue,
      deployment: deploymentQueue,
      buildSandbox: buildSandboxQueue,
      notifications: notificationsQueue,
    },
    req: opts.req,
  };
}
