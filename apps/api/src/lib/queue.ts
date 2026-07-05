/**
 * BullMQ 任务队列单例 - LynxKit API
 *
 * 用于异步执行 9 层 Agent 构建流程：
 *   - 避免阻塞 HTTP 请求（构建可能耗时数分钟）
 *   - 支持重试、延迟、优先级、并发控制
 *   - Worker 在 queues/build-worker.ts 中消费
 *
 * 当 Redis 不可用时返回 null，调用方需降级为同步执行（仅开发环境）。
 */
import { Queue } from "bullmq";
import type { ConnectionOptions } from "bullmq";

import { env } from "../env.js";
import { logger } from "./logger.js";
import { getRedis } from "./redis.js";

/** 构建队列名称（BullMQ 不允许队列名包含 ':'，使用 '-' 分隔） */
export const BUILD_QUEUE_NAME = "lynxkit-build";

/** 构建任务输入参数 */
export interface BuildJobData {
  /** 构建会话 ID */
  sessionId: string;
  /** 触发用户 ID */
  userId: string;
  /** 用户原始需求描述 */
  userInput: string;
  /** 用户在澄清阶段补充的答案 */
  answers?: Record<string, unknown>;
  /** 目标部署服务器 ID（可选） */
  serverId?: string;
  /** 自定义域名（可选） */
  domain?: string;
}

let queueInstance: Queue<BuildJobData> | null = null;

/**
 * 获取 BullMQ Queue 单例。
 *
 * @returns Queue 实例；Redis 不可用时返回 null（开发环境可同步执行）
 */
export function getBuildQueue(): Queue<BuildJobData> | null {
  const redis = getRedis();
  if (!redis) {
    logger.warn("Redis 不可用，构建队列未初始化（构建将同步执行）");
    return null;
  }
  if (!queueInstance) {
    const connection: ConnectionOptions = {
      // BullMQ 复用 ioredis 连接选项；此处直接传 REDIS_URL
      url: env.REDIS_URL,
    };
    queueInstance = new Queue<BuildJobData>(BUILD_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      },
    });
    logger.info({ queue: BUILD_QUEUE_NAME }, "BullMQ 构建队列已初始化");
  }
  return queueInstance;
}

/**
 * 入队一个构建任务。
 *
 * @returns 任务 ID；队列不可用时返回 null（调用方应同步执行）
 */
export async function enqueueBuild(data: BuildJobData): Promise<string | null> {
  const queue = getBuildQueue();
  if (!queue) return null;
  const job = await queue.add("build", data, { jobId: data.sessionId });
  return job.id ?? null;
}

/**
 * 关闭队列连接（用于优雅停机）。
 */
export async function closeBuildQueue(): Promise<void> {
  if (queueInstance) {
    await queueInstance.close();
    queueInstance = null;
    logger.info("BullMQ 构建队列已关闭");
  }
}
