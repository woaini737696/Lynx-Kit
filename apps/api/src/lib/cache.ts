/**
 * Redis 缓存层 - LynxKit API
 *
 * 来源：docs/ARCHITECTURE_REVIEW.md P1 优化建议
 *
 * 设计目标：
 *   - 公开 GET 接口加速（商店列表 / 产品详情 / 会员档位等）
 *   - 写操作自动失效（POST / PATCH / DELETE 时手动 invalidate）
 *   - Redis 不可用时自动降级到无缓存（直接走数据库）
 *   - 支持 JSON 序列化与 TTL（默认 60s）
 *
 * 使用模式：
 *   ```ts
 *   import { cacheGet, cacheSet, cacheInvalidate, cached } from "../lib/cache.js";
 *
 *   // 1. 显式调用
 *   const cached = await cacheGet("store:list:page1");
 *   if (cached) return c.json(cached);
 *   const data = await db.query.storeProducts.findMany(...);
 *   await cacheSet("store:list:page1", data, 60);
 *
 *   // 2. 包装函数（推荐）
 *   const result = await cached("store:list:page1", () => fetchFromDb(), 60);
 *
 *   // 3. 失效
 *   await cacheInvalidate("store:list:*"); // 模式匹配批量失效
 *   ```
 */
import { getRedis } from "./redis.js";
import { logger } from "./logger.js";

/** 默认 TTL（秒）：1 分钟 */
const DEFAULT_TTL = 60;

/** 缓存命中/未命中计数（用于调试，非业务指标） */
let hitCount = 0;
let missCount = 0;

/**
 * 读取缓存值。Redis 不可用或反序列化失败时返回 null。
 *
 * @param key 缓存键（建议命名空间格式：domain:action:arg）
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const raw = await redis.get(key);
    if (raw === null) {
      missCount++;
      return null;
    }
    hitCount++;
    return JSON.parse(raw) as T;
  } catch (err) {
    logger.warn({ err, key }, "缓存读取失败，降级为数据库查询");
    return null;
  }
}

/**
 * 写入缓存值。Redis 不可用时静默跳过。
 *
 * @param key 缓存键
 * @param value 任意可 JSON 序列化的值
 * @param ttlSeconds 过期时间（秒），默认 60s
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number = DEFAULT_TTL,
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    const payload = JSON.stringify(value);
    await redis.set(key, payload, "EX", ttlSeconds);
  } catch (err) {
    logger.warn({ err, key }, "缓存写入失败，可忽略");
  }
}

/**
 * 失效单个键。
 */
export async function cacheInvalidate(key: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.del(key);
  } catch (err) {
    logger.warn({ err, key }, "缓存失效失败，可忽略");
  }
}

/**
 * 按模式批量失效。
 *
 * 注意：使用 SCAN 而非 KEYS，避免阻塞 Redis（生产环境 O(N)）。
 *
 * @param pattern glob 模式（如 "store:list:*" 或 "store:*"）
 */
export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    let cursor = "0";
    do {
      const [next, keys] = await redis.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100,
      );
      cursor = next;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== "0");
  } catch (err) {
    logger.warn({ err, pattern }, "缓存批量失效失败，可忽略");
  }
}

/**
 * 缓存包装器：先查缓存，未命中则执行 loader 并写回缓存。
 *
 * 推荐用法：
 *   ```ts
 *   const items = await cached("store:list:page1", () => fetchFromDb(), 60);
 *   ```
 *
 * @param key 缓存键
 * @param loader 数据加载函数（缓存未命中时调用）
 * @param ttlSeconds 过期时间（秒）
 */
export async function cached<T>(
  key: string,
  loader: () => Promise<T>,
  ttlSeconds: number = DEFAULT_TTL,
): Promise<T> {
  const cachedValue = await cacheGet<T>(key);
  if (cachedValue !== null) {
    return cachedValue;
  }

  const fresh = await loader();
  await cacheSet(key, fresh, ttlSeconds);
  return fresh;
}

/**
 * 获取缓存统计信息（用于 /metrics 或调试）。
 */
export function getCacheStats(): {
  hits: number;
  misses: number;
  hitRate: number;
} {
  const total = hitCount + missCount;
  return {
    hits: hitCount,
    misses: missCount,
    hitRate: total === 0 ? 0 : hitCount / total,
  };
}
