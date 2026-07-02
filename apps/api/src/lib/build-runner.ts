/**
 * 构建任务执行器 - LynxKit API
 *
 * 提取自 queues/build-worker.ts，供同步（开发模式降级）与异步（BullMQ Worker）共用。
 *
 * 职责：
 *   1. 加载构建会话并校验归属
 *   2. 构造 OrchestratorContext 并执行 orch.run()
 *   3. 通过 onLog 回调实时写入 build_logs
 *   4. 最终更新 build_sessions 状态（DEPLOYED / ERROR）
 *
 * 不依赖 BullMQ / Redis，可被 build.ts 的 start 端点在 Redis 不可用时直接调用。
 */
import { eq } from "drizzle-orm";

import { buildSessions, buildLogs } from "@lynxkit/db";
import {
  Orchestrator,
  type OrchestratorContext,
  type OrchestratorResult,
} from "@lynxkit/agent-core";
import { type AgentLog, type AgentRole, LogLevel } from "@lynxkit/shared";

import { getDb } from "./db.js";
import { logger } from "./logger.js";

/** 构建任务输入参数（与 lib/queue.ts 的 BuildJobData 对齐） */
export interface BuildJobData {
  sessionId: string;
  userId: string;
  userInput: string;
  answers?: Record<string, unknown>;
  serverId?: string;
  domain?: string;
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
 * 处理单个构建任务
 *
 * @param data 任务输入（sessionId / userId / userInput / answers / serverId）
 */
export async function processBuildJob(data: BuildJobData): Promise<void> {
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
