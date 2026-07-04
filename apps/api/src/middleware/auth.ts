/**
 * JWT 鉴权中间件 - LynxKit API
 *
 * 职责：
 *   - 从 Authorization header 提取 Bearer token
 *   - 用 jose 验证 access token（含过期、签名、issuer 校验）
 *   - 校验 Redis 黑名单（登出 / 修改密码后立即失效）
 *   - 注入用户信息到 Hono context：c.set('user', user)
 *
 * 用法：
 *   app.use('/api/v1/build/*', authMiddleware);
 *
 * 未通过校验时抛出 UnauthorizedError，由全局 errorHandler 转为 401 响应。
 */
import type { MiddlewareHandler } from "hono";

import { signAccessToken, verifyToken, extractBearerToken } from "../lib/jwt.js";
import { getRedis } from "../lib/redis.js";
import { UnauthorizedError } from "./error.js";

/** context 中存储用户信息的 key */
export const USER_KEY = "user";

/** 注入到 context 的用户对象 */
export interface AuthUser {
  /** 用户 ID */
  id: string;
  /** 手机号（登录主标识） */
  phone: string;
  /** 角色 */
  role: string;
}

/**
 * Redis 中 JWT 黑名单的 key 前缀
 *
 * 登出时将 access token 加入黑名单，TTL 与 token 剩余有效期一致。
 */
const BLACKLIST_PREFIX = "lynxkit:jwt:blacklist:";

/**
 * 检查 token 是否在黑名单中（已登出 / 已撤销）
 */
async function isTokenBlacklisted(token: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false; // Redis 不可用时降级为不检查黑名单
  const key = BLACKLIST_PREFIX + tokenHash(token);
  const result = await redis.get(key);
  return result === "1";
}

/**
 * 简单 hash（避免完整 token 作为 key 过长；非安全用途）
 */
function tokenHash(token: string): string {
  // 取 token 的中间 32 字符作为指纹
  const len = token.length;
  const start = Math.floor(len / 2) - 16;
  return token.slice(Math.max(0, start), Math.max(0, start) + 32);
}

/**
 * 将 token 加入黑名单（登出时调用）
 *
 * @param token access token
 * @param ttlSec 剩余有效期（秒）
 */
export async function blacklistToken(token: string, ttlSec: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  if (ttlSec <= 0) return;
  await redis.set(BLACKLIST_PREFIX + tokenHash(token), "1", "EX", ttlSec);
}

/**
 * JWT 鉴权中间件
 *
 * 验证流程：
 *   1. 提取 Bearer token
 *   2. jose 验证签名 + 过期 + 类型
 *   3. 检查 Redis 黑名单
 *   4. 注入 user 到 context
 */
export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header("authorization");
  const token = extractBearerToken(authHeader);

  if (!token) {
    throw new UnauthorizedError("缺少 Authorization Bearer token");
  }

  // 1. 验证 token
  let payload;
  try {
    payload = await verifyToken(token, "access");
  } catch {
    throw new UnauthorizedError("token 无效或已过期");
  }

  // 2. 检查黑名单
  if (await isTokenBlacklisted(token)) {
    throw new UnauthorizedError("token 已失效，请重新登录");
  }

  // 3. 注入用户信息
  const user: AuthUser = {
    id: payload.sub,
    phone: payload.phone,
    role: payload.role,
  };
  c.set(USER_KEY, user);

  await next();
};

/**
 * 从 context 获取当前登录用户
 *
 * @throws 未通过 authMiddleware 时抛出
 */
export function getCurrentUser(c: {
  get: (key: string) => unknown;
}): AuthUser {
  const user = c.get(USER_KEY);
  if (!user) {
    throw new UnauthorizedError("未登录");
  }
  return user as AuthUser;
}

/**
 * 可选鉴权中间件
 *
 * 与 authMiddleware 类似，但 token 缺失或无效时不报错，仅不注入 user。
 * 用于商店等公开接口中"登录用户可见更多内容"的场景。
 */
export const optionalAuthMiddleware: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header("authorization");
  const token = extractBearerToken(authHeader);
  if (!token) {
    await next();
    return;
  }
  try {
    const payload = await verifyToken(token, "access");
    if (!(await isTokenBlacklisted(token))) {
      c.set(USER_KEY, {
        id: payload.sub,
        phone: payload.phone,
        role: payload.role,
      });
    }
  } catch {
    // token 无效时静默忽略
  }
  await next();
};

// 重新导出 signAccessToken 供 auth 路由使用
export { signAccessToken };
