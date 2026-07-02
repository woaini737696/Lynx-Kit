/**
 * 构建任务 Worker - LynxKit API
 *
 * 消费 BullMQ 构建队列，调用 @lynxkit/agent-core 的 Orchestrator
 * 执行完整的 9 层 Agent 流水线。
 *
 * 启动：pnpm worker  （独立进程，与 API 服务解耦）
 *
 * 流程：
 *   1. 从 BullMQ 队列消费 build 任务
 *   2. 加载构建会话与配置
 *   3. 构造 OrchestratorContext 并执行 orch.run()
 *   4. 通过 onLog 回调实时写入 build_logs
 *   5. 最终更新 build_sessions 状态（DEPLOYED / ERROR）
 */
import { Worker } from "bullmq";
import { eq } from "drizzle-orm";
import type { ConnectionOptions } from "bullmq";

import { buildSessions, buildLogs } from "@lynxkit/db";
import { Orchestrator, type OrchestratorContext, type OrchestratorResult } from "@lynxkit/agent-core";
import { type AgentLog, type AgentRole, LogLevel } from "@lynxkit/shared";

import { env } from "../env.js";
import { getDb } from "../lib/db.js";
import { getRedis } from "../lib/redis.js";
import { logger } from "../lib/logger.js";
import { BUILD_QUEUE_NAME, type BuildJobData } from "../lib/queue.js";

/**
 * Worker 并发数（单实例同时处理的构建任务数）
 *
 * 受限于 AI Provider 速率限制与数据库连接数，建议保持 1~3。
 */
const WORKER_CONCURRENCY = 1;

/**
 * 处理单个构建任务
 *
 * @param data 任务输入（sessionId / userId / userInput / answers / serverId）
 */
async function processBuildJob(data: BuildJobData): Promise<void> {
  const db = getDb();
  const { sessionId, userId, userInput, answers } = data;

  logger.info({ sessionId, userId }, "开始处理构建任务");

  // 加载会话（确认存在且属于该用户）
  const session = await db.query.buildSessions.findFirst({
    where: eq(buildSessions.id, sessionId),
  });
  if (!session) {
    logger.error({ sessionId }, "构建会话不存在，任务终止");
    return;
  }
  if (session.userId !== userId) {
    logger.error({ sessionId, userId, ownerId: session.userId }, "用户无权操作该会话");
    return;
  }

  // 更新状态为开发中
  await db
    .update(buildSessions)
    .set({ status: "DEVELOPING", updatedAt: new Date() })
    .where(eq(buildSessions.id, sessionId));

  await writeLog(sessionId, "orchestrator", "INFO", "Agent 流水线启动", {
    userId,
    productType: session.productType,
  });

  // 收集日志，用于阶段批量写入
  const logBuffer: AgentLog[] = [];

  // 构造编排器上下文
  const ctx: OrchestratorContext = {
    sessionId,
    userId,
    inspiration: userInput,
    answers,
    onLog: (log: AgentLog) => {
      logBuffer.push(log);
    },
    onProgress: (agent: AgentRole, progress: number) => {
      logger.debug({ sessionId, agent, progress }, "Agent 进度更新");
    },
    onStream: (chunk: string) => {
      // 流式输出仅日志，不存储（前端通过 SSE 实时接收）
      logger.debug({ sessionId, chunkLen: chunk.length }, "流式输出");
    },
  };

  const orchestrator = new Orchestrator(ctx);

  try {
    // 执行 9 层 Agent 流水线
    const result: OrchestratorResult = await orchestrator.run();

    // 批量写入收集的日志
    for (const logEntry of logBuffer) {
      await writeLog(
        sessionId,
        logEntry.agent,
        logEntry.level === LogLevel.ERROR ? "ERROR" : logEntry.level === LogLevel.WARN ? "WARN" : "INFO",
        logEntry.message,
        {
          stage: logEntry.agent,
          timestamp: logEntry.createdAt,
          ...logEntry.metadata,
        },
      );
    }

    // 构建成功 → 更新状态为已部署
    await db
      .update(buildSessions)
      .set({
        status: "DEPLOYED",
        deployUrl: result.deployUrl ?? null,
        architecture: result.architecture as never,
        generatedCode: result.generatedFiles as never,
        updatedAt: new Date(),
      })
      .where(eq(buildSessions.id, sessionId));

    await writeLog(sessionId, "orchestrator", "INFO", "构建完成并部署成功", {
      deployUrl: result.deployUrl,
      testPassed: result.testPassed,
      fixLevel: result.fixLevel,
      fileCount: result.generatedFiles.length,
    });

    logger.info(
      { sessionId, deployUrl: result.deployUrl, fileCount: result.generatedFiles.length },
      "构建任务完成",
    );
  } catch (err) {
    // 批量写入已收集的日志
    for (const logEntry of logBuffer) {
      await writeLog(
        sessionId,
        logEntry.agent,
        logEntry.level === LogLevel.ERROR ? "ERROR" : "INFO",
        logEntry.message,
        { stage: logEntry.agent, timestamp: logEntry.createdAt, ...logEntry.metadata },
      );
    }

    // 未捕获异常 → 标记为错误
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(buildSessions)
      .set({ status: "ERROR", updatedAt: new Date() })
      .where(eq(buildSessions.id, sessionId));

    await writeLog(sessionId, "orchestrator", "ERROR", `构建异常：${message}`, {
      stack: err instanceof Error ? err.stack : undefined,
    });

    logger.error({ err, sessionId }, "构建任务异常");
    throw err; // 重新抛出，让 BullMQ 记录失败
  }
}

/**
 * 写入构建日志到数据库
 */
async function writeLog(
  sessionId: string,
  agent: string,
  level: "INFO" | "WARN" | "ERROR" | "DEBUG",
  message: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const db = getDb();
  try {
    await db.insert(buildLogs).values({
      sessionId,
      agent,
      level,
      message,
      metadata: metadata ?? null,
    });
  } catch (err) {
    // 日志写入失败不应影响构建流程
    logger.error({ err, sessionId }, "写入构建日志失败");
  }
}

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
    // @ts-expect-error BullMQ 接受 ioredis 兼容配置
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
