/**
 * 限流中间件 - LynxKit API
 *
 * 基于 @upstash/ratelimit 实现分布式限流：
 *   - 配置 UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN → 分布式限流
 *   - 未配置 Upstash → 降级为内存限流（仅适用于单实例）
 *
 * 限流维度：
 *   - 默认按 IP 限流（10 次/分钟）
 *   - 已登录用户叠加按 userId 限流（100 次/小时）
 *
 * 超出限流时抛出 RateLimitError → 429 响应。
 */
import type { MiddlewareHandler } from "hono";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { env } from "../env.js";
import { RATE_LIMIT } from "@lynxkit/shared";
import { logger } from "../lib/logger.js";
import { RateLimitError } from "./error.js";

/**
 * 内存限流桶（降级方案）
 *
 * 简单的固定窗口计数器，仅在单实例开发环境使用。
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const ipBuckets = new Map<string, Bucket>();

function checkMemoryBucket(
  key: string,
  max: number,
  windowSec: number,
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const bucket = ipBuckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    ipBuckets.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return { success: true, remaining: max - 1, reset: now + windowSec * 1000 };
  }
  if (bucket.count >= max) {
    return { success: false, remaining: 0, reset: bucket.resetAt };
  }
  bucket.count += 1;
  return { success: true, remaining: max - bucket.count, reset: bucket.resetAt };
}

/**
 * Upstash Ratelimit 实例（懒初始化）
 */
let ratelimitInstance: Ratelimit | null = null;
let initWarned = false;

function getRatelimiter(): Ratelimit | null {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    if (!initWarned) {
      logger.warn("Upstash 未配置，限流降级为内存模式（仅适用于单实例开发）");
      initWarned = true;
    }
    return null;
  }
  if (!ratelimitInstance) {
    const redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
    ratelimitInstance = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMIT.perIp.requests,
        `${RATE_LIMIT.perIp.windowSec}s`,
      ),
      prefix: "lynxkit:ratelimit",
    });
  }
  return ratelimitInstance;
}

/**
 * 获取客户端真实 IP
 *
 * 优先读取反向代理设置的 X-Forwarded-For / X-Real-IP，
 * 回退到 Hono 的 c.req.header('x-forwarded-for')。
 */
function getClientIp(c: { req: { header: (name: string) => string | undefined } }): string {
  const xff = c.req.header("x-forwarded-for");
  if (xff) {
    return xff.split(",")[0]?.trim() ?? "127.0.0.1";
  }
  const xRealIp = c.req.header("x-real-ip");
  if (xRealIp) return xRealIp;
  return "127.0.0.1";
}

/**
 * 限流中间件
 *
 * 已配置 Upstash 时使用分布式限流；否则降级为内存限流。
 */
export const rateLimitMiddleware: MiddlewareHandler = async (c, next) => {
  const ip = getClientIp(c);
  const ratelimit = getRatelimiter();

  let result: { success: boolean; remaining: number; reset: number };

  if (ratelimit) {
    const r = await ratelimit.limit(`ip:${ip}`);
    result = { success: r.success, remaining: r.remaining, reset: r.reset };
  } else {
    result = checkMemoryBucket(
      `ip:${ip}`,
      RATE_LIMIT.perIp.requests,
      RATE_LIMIT.perIp.windowSec,
    );
  }

  // 设置限流响应头（参考标准 RateLimit-* headers）
  c.res.headers.set("RateLimit-Limit", String(RATE_LIMIT.perIp.requests));
  c.res.headers.set("RateLimit-Remaining", String(result.remaining));
  c.res.headers.set("RateLimit-Reset", String(Math.floor(result.reset / 1000)));

  if (!result.success) {
    const retryAfterSec = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
    c.res.headers.set("Retry-After", String(retryAfterSec));
    throw new RateLimitError(`请求过于频繁，请 ${retryAfterSec} 秒后重试`);
  }

  await next();
};

/**
 * 用户级限流（用于敏感操作，如发送验证码）
 *
 * 用法：app.post('/send-code', rateLimitByUser(5, 60), handler)
 *
 * @param maxRequests 每窗口最大请求数
 * @param windowSec 窗口大小（秒）
 */
export function rateLimitByUser(
  maxRequests: number,
  windowSec: number,
): MiddlewareHandler {
  return async (c, next) => {
    // 用户级限流依赖已注入的 user（需先经过 authMiddleware）
    const user = c.get("user") as { id?: string } | undefined;
    const identifier = user?.id ?? getClientIp(c);
    const key = `user:${identifier}`;

    const ratelimit = getRatelimiter();
    let result: { success: boolean; remaining: number; reset: number };

    if (ratelimit) {
      const r = await ratelimit.limit(key);
      result = { success: r.success, remaining: r.remaining, reset: r.reset };
    } else {
      result = checkMemoryBucket(key, maxRequests, windowSec);
    }

    if (!result.success) {
      const retryAfterSec = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
      c.res.headers.set("Retry-After", String(retryAfterSec));
      throw new RateLimitError(`操作过于频繁，请 ${retryAfterSec} 秒后重试`);
    }

    await next();
  };
}
