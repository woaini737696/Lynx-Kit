/**
 * Redis 客户端单例 - LynxKit API
 *
 * 基于 ioredis，用于：
 *   - JWT 黑名单（登出后令牌立即失效）
 *   - 短信验证码缓存
 *   - BullMQ 队列底层存储
 *   - SSE 会话状态
 *
 * 当 REDIS_URL 未配置时，返回 null，调用方需自行降级（如内存限流）。
 */
import IORedis from "ioredis";

import { env } from "../env.js";
import { logger } from "./logger.js";

let redisInstance: IORedis | null = null;
let initWarned = false;

/**
 * 获取 Redis 单例。
 *
 * @returns ioredis 客户端实例；REDIS_URL 未配置时返回 null
 */
export function getRedis(): IORedis | null {
  if (!env.REDIS_URL) {
    if (!initWarned) {
      logger.warn("REDIS_URL 未配置，Redis 相关功能将降级为内存模式（不可用于生产）");
      initWarned = true;
    }
    return null;
  }
  if (!redisInstance) {
    redisInstance = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });
    redisInstance.on("error", (err) => {
      logger.error({ err }, "Redis 连接异常");
    });
    redisInstance.on("connect", () => {
      logger.info("Redis 连接已建立");
    });
  }
  return redisInstance;
}

/**
 * 关闭 Redis 连接（用于优雅停机）。
 */
export async function closeRedis(): Promise<void> {
  if (redisInstance) {
    await redisInstance.quit();
    redisInstance = null;
    logger.info("Redis 连接已关闭");
  }
}
