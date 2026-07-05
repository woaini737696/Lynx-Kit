/**
 * 构建任务 Worker - LynxKit API
 *
 * 消费 BullMQ 构建队列，委托给 @lynxkit/agent-core 的 Orchestrator
 * 执行完整的 9 层 Agent 流水线。
 *
 * 启动：pnpm worker  （独立进程，与 API 服务解耦）
 * 生产部署：PM2 fork 模式单实例（避免集群模式下重复消费队列）
 *
 * 流程：
 *   1. 从 BullMQ 队列消费 build 任务
 *   2. 调用共享的 processBuildJob（lib/build-runner.ts）
 *      - 加载构建会话与配置
 *      - 构造 OrchestratorContext 并执行 orch.run()
 *      - 通过 onLog 回调实时写入 build_logs
 *      - 最终更新 build_sessions 状态（DEPLOYED / ERROR）
 *
 * 注意：processBuildJob 与 lib/build-service.ts 的同步降级路径共用，
 * 任何执行逻辑变更只需修改 build-runner.ts 一处。
 */
// 在最早期加载 .env 文件（PM2 部署时 --env-file 参数不生效）
try {
  (process as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.(".env");
} catch {
  // .env 文件不存在时忽略
}

import { Worker } from "bullmq";
import type { ConnectionOptions } from "bullmq";

import { env } from "../env.js";
import { getRedis } from "../lib/redis.js";
import { logger } from "../lib/logger.js";
import { processBuildJob } from "../lib/build-runner.js";
import { BUILD_QUEUE_NAME, type BuildJobData } from "../lib/queue.js";

/**
 * Worker 并发数（单实例同时处理的构建任务数）
 *
 * 受限于 AI Provider 速率限制与数据库连接数，建议保持 1~3。
 */
const WORKER_CONCURRENCY = 1;

/**
 * 启动 Worker
 */
async function startWorker(): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    logger.error("Redis 不可用，Worker 无法启动（构建队列依赖 Redis）");
    process.exit(1);
  }

  const connection: ConnectionOptions = {
    url: env.REDIS_URL,
  };

  const worker = new Worker<BuildJobData>(
    BUILD_QUEUE_NAME,
    async (job) => {
      logger.info({ jobId: job.id, name: job.name }, "Worker 接收到任务");
      await processBuildJob(job.data);
    },
    {
      connection,
      concurrency: WORKER_CONCURRENCY,
    },
  );

  worker.on("completed", (job) => {
    logger.info({ jobId: job.id }, "Worker 任务完成");
  });

  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, "Worker 任务失败");
  });

  worker.on("error", (err) => {
    logger.error({ err: err.message }, "Worker 异常");
  });

  logger.info(
    { queue: BUILD_QUEUE_NAME, concurrency: WORKER_CONCURRENCY },
    "🏗️  LynxKit 构建 Worker 已启动",
  );

  // 优雅停机
  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Worker 收到停机信号，等待当前任务完成...");
    await worker.close();
    logger.info("Worker 已关闭，进程退出");
    process.exit(0);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

// 启动 Worker
startWorker().catch((err) => {
  logger.error({ err }, "Worker 启动失败");
  process.exit(1);
});
