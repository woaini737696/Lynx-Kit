/**
 * Prometheus 监控 - LynxKit API
 *
 * 来源：docs/ARCHITECTURE_REVIEW.md P2 优化建议
 *
 * 设计：
 *   - 使用 prom-client 收集默认指标（CPU/内存/事件循环/GC）+ 自定义业务指标
 *   - /metrics 端点暴露 Prometheus 文本格式
 *   - 集群模式下默认使用默认聚合器（每个实例独立暴露，由 Prometheus 服务端拉取聚合）
 *   - 业务指标通过 recordXxx 函数在路由层显式调用
 *
 * 安全：
 *   - /metrics 端点不带鉴权，但建议在 Nginx 层限制仅内网访问
 *   - PROMETHEUS_ENABLED=false 时完全禁用（端点返回 404）
 */
import promClient, { Counter, Histogram, Gauge } from "prom-client";
import { env } from "../env.js";
import { logger } from "./logger.js";
import { getCacheStats } from "./cache.js";

let initialized = false;

// ===== 自定义业务指标 =====

/** HTTP 请求总数（按 method/route/status 维度） */
let httpRequestCounter: Counter<string> | null = null;

/** HTTP 请求耗时（直方图） */
let httpRequestDurationHistogram: Histogram<string> | null = null;

/** 构建任务总数（按 status） */
let buildJobCounter: Counter<string> | null = null;

/** 构建任务耗时（直方图） */
let buildJobDurationHistogram: Histogram<string> | null = null;

/** 商店产品上架计数（按 category） */
let storePublishCounter: Counter<string> | null = null;

/** 商店购买计数（按 type） */
let storePurchaseCounter: Counter<string> | null = null;

/** S 币交易计数（按 type） */
let scoinTxCounter: Counter<string> | null = null;

/** 缓存命中率（Gauge，每次拉取 metrics 时刷新） */
let cacheHitRateGauge: Gauge<string> | null = null;

/** Redis 连接状态（0=未连接，1=已连接） */
let redisConnectedGauge: Gauge<string> | null = null;

/**
 * 初始化所有指标。仅可被调用一次。
 */
export function initMetrics(): void {
  if (initialized || !env.PROMETHEUS_ENABLED) return;
  initialized = true;

  // 默认指标（CPU/内存/事件循环/GC/进程）
  promClient.collectDefaultMetrics({
    register: promClient.register,
    prefix: "lynxkit_",
  });

  // HTTP 请求计数器
  httpRequestCounter = new Counter({
    name: "lynxkit_http_requests_total",
    help: "HTTP 请求总数",
    labelNames: ["method", "route", "status"],
    registers: [promClient.register],
  });

  // HTTP 请求耗时
  httpRequestDurationHistogram = new Histogram({
    name: "lynxkit_http_request_duration_seconds",
    help: "HTTP 请求耗时（秒）",
    labelNames: ["method", "route", "status"],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [promClient.register],
  });

  // 构建任务
  buildJobCounter = new Counter({
    name: "lynxkit_build_jobs_total",
    help: "构建任务计数",
    labelNames: ["status"],
    registers: [promClient.register],
  });

  buildJobDurationHistogram = new Histogram({
    name: "lynxkit_build_job_duration_seconds",
    help: "构建任务耗时（秒）",
    labelNames: ["status"],
    buckets: [1, 5, 10, 30, 60, 120, 300, 600, 1800, 3600],
    registers: [promClient.register],
  });

  // 商店指标
  storePublishCounter = new Counter({
    name: "lynxkit_store_publish_total",
    help: "产品上架计数",
    labelNames: ["category"],
    registers: [promClient.register],
  });

  storePurchaseCounter = new Counter({
    name: "lynxkit_store_purchase_total",
    help: "产品购买计数",
    labelNames: ["type"],
    registers: [promClient.register],
  });

  // S 币交易
  scoinTxCounter = new Counter({
    name: "lynxkit_scoin_transactions_total",
    help: "S 币交易计数",
    labelNames: ["type"],
    registers: [promClient.register],
  });

  // 缓存指标
  cacheHitRateGauge = new Gauge({
    name: "lynxkit_cache_hit_rate",
    help: "Redis 缓存命中率",
    registers: [promClient.register],
  });

  redisConnectedGauge = new Gauge({
    name: "lynxkit_redis_connected",
    help: "Redis 连接状态（0=未连接，1=已连接）",
    registers: [promClient.register],
  });

  logger.info("Prometheus 指标已初始化");
}

/**
 * 输出 Prometheus 文本格式指标。
 */
export async function getMetricsString(): Promise<string> {
  // 刷新缓存命中率 Gauge（每次拉取时更新）
  if (cacheHitRateGauge) {
    const stats = getCacheStats();
    cacheHitRateGauge.set(stats.hitRate);
  }

  // 刷新 Redis 连接状态
  if (redisConnectedGauge) {
    const { getRedis } = await import("./redis.js");
    const redis = getRedis();
    redisConnectedGauge.set(redis?.status === "ready" ? 1 : 0);
  }

  return promClient.register.metrics();
}

/**
 * 返回 Prometheus Content-Type（用于 Hono 响应头）
 */
export function getMetricsContentType(): string {
  return promClient.register.contentType;
}

// ===== 业务指标记录函数（路由层调用）=====

/**
 * 记录 HTTP 请求（在 requestLogger 中间件中调用）
 */
export function recordHttpRequest(
  method: string,
  route: string,
  status: number,
  durationSeconds: number,
): void {
  if (!env.PROMETHEUS_ENABLED) return;
  httpRequestCounter?.labels(method, route, String(status)).inc();
  httpRequestDurationHistogram?.labels(method, route, String(status)).observe(durationSeconds);
}

/**
 * 记录构建任务状态变更
 */
export function recordBuildJob(status: "completed" | "failed", durationSeconds: number): void {
  if (!env.PROMETHEUS_ENABLED) return;
  buildJobCounter?.labels(status).inc();
  buildJobDurationHistogram?.labels(status).observe(durationSeconds);
}

/**
 * 记录商店产品上架
 */
export function recordStorePublish(category: string): void {
  if (!env.PROMETHEUS_ENABLED) return;
  storePublishCounter?.labels(category).inc();
}

/**
 * 记录商店购买
 */
export function recordStorePurchase(type: string): void {
  if (!env.PROMETHEUS_ENABLED) return;
  storePurchaseCounter?.labels(type).inc();
}

/**
 * 记录 S 币交易
 */
export function recordSCoinTransaction(type: string): void {
  if (!env.PROMETHEUS_ENABLED) return;
  scoinTxCounter?.labels(type).inc();
}

/**
 * 是否启用 Prometheus 监控
 */
export function isPrometheusEnabled(): boolean {
  return env.PROMETHEUS_ENABLED;
}
