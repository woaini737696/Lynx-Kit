/**
 * BullMQ 任务队列初始化
 *
 * 4 个核心队列：
 *   - codeGeneration: AI 代码生成（消耗 Anthropic / OpenAI 调用，长耗时）
 *   - deployment: 部署到用户服务器（SSH + Docker）
 *   - buildSandbox: 沙箱编译（Docker build）
 *   - notifications: 推送通知（FCM / 邮件 / Webhook）
 *
 * 队列状态存储于 Redis，Worker 进程可水平扩展。
 */
import { Queue } from "bullmq";

import IORedis from "ioredis";

import { QUEUE_NAMES } from "@lynxkit/shared/constants";

import { logger } from "./logger.js";

/** Redis 连接（BullMQ 要求 maxRetriesPerRequest=null） */
let connection: IORedis | null = null;

/**
 * 获取共享的 Redis 连接（单例）
 */
export function getRedisConnection(): IORedis {
  if (connection) return connection;

  const url = process.env.REDIS_URL;
  if (!url) {
    logger.error("REDIS_URL 环境变量未配置");
    throw new Error("REDIS_URL 环境变量未配置，请检查 .env");
  }

  connection = new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    retryStrategy: (times) => {
      if (times > 10) {
        logger.error({ times }, "Redis 重试次数超限");
        return null;
      }
      return Math.min(times * 200, 2000);
    },
  });

  connection.on("error", (err) => {
    logger.error({ err }, "Redis 连接错误");
  });

  connection.on("connect", () => {
    logger.info("Redis 已连接");
  });

  return connection;
}

/** 代码生成队列（AI Agent 编排） */
export const codeGenerationQueue = new Queue(
  QUEUE_NAMES.codeGeneration,
  { connection: getRedisConnection() }
);

/** 部署队列（SSH + Docker） */
export const deploymentQueue = new Queue(QUEUE_NAMES.deployment, {
  connection: getRedisConnection(),
});

/** 沙箱编译队列 */
export const buildSandboxQueue = new Queue(QUEUE_NAMES.buildSandbox, {
  connection: getRedisConnection(),
});

/** 通知队列（FCM / 邮件 / Webhook） */
export const notificationsQueue = new Queue(QUEUE_NAMES.notifications, {
  connection: getRedisConnection(),
});

/**
 * 优雅关闭所有队列连接
 */
export async function closeQueues(): Promise<void> {
  await Promise.allSettled([
    codeGenerationQueue.close(),
    deploymentQueue.close(),
    buildSandboxQueue.close(),
    notificationsQueue.close(),
  ]);
  if (connection) {
    await connection.quit();
    connection = null;
  }
  logger.info("所有 BullMQ 队列已关闭");
}
