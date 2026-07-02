/**
 * Agent 流式接口路由 - LynxKit API
 *
 * 端点（全部需 auth 中间件）：
 *   POST /:sessionId/start           启动 Agent 流程（返回 SSE 流）
 *   POST /:sessionId/clarify         获取需求澄清问题
 *   POST /:sessionId/clarify-answer  提交澄清答案
 *   GET  /:sessionId/stream          SSE 流式订阅 Agent 进度
 *   POST /:sessionId/chat            对话式修改（streamText）
 *
 * 流式响应使用 Hono 的 streamSSE（hono/streaming）；
 * 对话式修改使用 Vercel AI SDK 的 streamText（通过 @ai-sdk/openai-compatible）。
 */
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { streamText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

import { env } from "../env.js";
import { buildSessions, buildLogs } from "@lynxkit/db";
import { getDb } from "../lib/db.js";
import { getRedis } from "../lib/redis.js";
import { enqueueBuild } from "../lib/queue.js";
import { generateClarifyQuestions } from "../lib/clarify-service.js";
import { logger } from "../lib/logger.js";
import { getCurrentUser } from "../middleware/auth.js";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from "../middleware/error.js";

export const agentRoutes = new Hono();

/**
 * 校验 sessionId 路径参数
 */
const sessionIdParam = z.object({
  sessionId: z.string().uuid("会话 ID 格式错误"),
});

/**
 * 启动 Agent 流程请求体
 */
const startAgentSchema = z.object({
  serverId: z.string().uuid().optional(),
  domain: z.string().optional(),
  answers: z.record(z.string(), z.unknown()).optional(),
});

/**
 * 提交澄清答案请求体
 */
const clarifyAnswerSchema = z.object({
  answers: z.record(z.string(), z.unknown()),
  confirmComplete: z.boolean().optional().default(false),
});

/**
 * 对话式修改请求体
 */
const chatSchema = z.object({
  /** 用户消息 */
  message: z.string().min(1, "消息不能为空").max(2000),
  /** AI Provider（默认 deepseek） */
  provider: z
    .enum(["deepseek", "kimi", "doubao", "qwen", "glm"])
    .optional()
    .default("deepseek"),
  /** 模型 ID */
  model: z.string().optional(),
});

/**
 * 内部辅助：加载构建会话并校验归属
 */
async function loadOwnedSession(sessionId: string, userId: string) {
  const db = getDb();
  const session = await db.query.buildSessions.findFirst({
    where: eq(buildSessions.id, sessionId),
  });
  if (!session) {
    throw new NotFoundError("构建会话");
  }
  if (session.userId !== userId) {
    throw new ForbiddenError("无权访问该构建会话");
  }
  return session;
}

/**
 * 写入 Agent 日志到数据库
 */
async function writeLog(
  sessionId: string,
  agent: string,
  level: "INFO" | "WARN" | "ERROR" | "DEBUG",
  message: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const db = getDb();
  await db.insert(buildLogs).values({
    sessionId,
    agent,
    level,
    message,
    metadata: metadata ?? null,
  });
}

/**
 * @openapi
 * POST /agent/:sessionId/start
 * @summary 启动 Agent 流程（返回 SSE 流）
 * @tags agent
 * @security BearerAuth
 */
agentRoutes.post(
  "/:sessionId/start",
  zValidator("param", sessionIdParam),
  zValidator("json", startAgentSchema.optional()),
  async (c) => {
    const { sessionId } = c.req.valid("param");
    const input = c.req.valid("json") ?? {};
    const user = getCurrentUser(c);
    const session = await loadOwnedSession(sessionId, user.id);

    // 更新状态为开发中
    const db = getDb();
    await db
      .update(buildSessions)
      .set({ status: "DEVELOPING", updatedAt: new Date() })
      .where(eq(buildSessions.id, sessionId));

    // 入队 BullMQ（异步执行 9 Agent）
    const jobId = await enqueueBuild({
      sessionId: session.id,
      userId: user.id,
      userInput: session.description ?? "",
      answers: input.answers,
      serverId: input.serverId ?? session.serverId ?? undefined,
      domain: input.domain,
    });

    return streamSSE(c, async (stream) => {
      await stream.writeSSE({
        event: "started",
        data: JSON.stringify({
          sessionId,
          jobId,
          streamUrl: `/api/v1/agent/${sessionId}/stream`,
        }),
      });
      // 启动事件后由客户端转而订阅 /stream 接口持续接收进度
      await stream.writeSSE({
        event: "done",
        data: JSON.stringify({ message: "启动事件已发送，请订阅 stream 接口" }),
      });
    });
  },
);

/**
 * @openapi
 * POST /agent/:sessionId/clarify
 * @summary 获取需求澄清问题
 * @tags agent
 * @security BearerAuth
 */
agentRoutes.post(
  "/:sessionId/clarify",
  zValidator("param", sessionIdParam),
  async (c) => {
    const { sessionId } = c.req.valid("param");
    const user = getCurrentUser(c);
    const session = await loadOwnedSession(sessionId, user.id);

    // 更新状态为澄清中
    const db = getDb();
    await db
      .update(buildSessions)
      .set({ status: "CLARIFYING", updatedAt: new Date() })
      .where(eq(buildSessions.id, sessionId));

    // 调用 agent-core 的 IntentAgent + ClarifyAgent 生成动态问题
    const result = await generateClarifyQuestions({
      sessionId,
      userId: user.id,
      inspiration:
        session.description ??
        (session.config as { userInput?: string })?.userInput ??
        "",
      answers: (session.config as { answers?: Record<string, unknown> })
        ?.answers,
    });

    await writeLog(
      sessionId,
      "clarify",
      "INFO",
      "需求澄清已启动（agent-core 动态生成）",
      {
        questionCount: result.questions.length,
        productType: result.productType,
      },
    );

    return c.json({
      sessionId,
      stage: "clarify",
      productType: result.productType,
      questions: result.questions,
      answers: result.answers,
    });
  },
);

/**
 * @openapi
 * POST /agent/:sessionId/clarify-answer
 * @summary 提交澄清答案
 * @tags agent
 * @security BearerAuth
 */
agentRoutes.post(
  "/:sessionId/clarify-answer",
  zValidator("param", sessionIdParam),
  zValidator("json", clarifyAnswerSchema),
  async (c) => {
    const { sessionId } = c.req.valid("param");
    const input = c.req.valid("json");
    const user = getCurrentUser(c);
    const session = await loadOwnedSession(sessionId, user.id);

    const db = getDb();
    // 合并答案到 config
    const existingConfig = (session.config as Record<string, unknown>) ?? {};
    const mergedConfig = {
      ...existingConfig,
      answers: { ...(existingConfig.answers as Record<string, unknown>), ...input.answers },
    };

    const nextStatus = input.confirmComplete ? "ARCHITECTING" : "CLARIFYING";
    await db
      .update(buildSessions)
      .set({ config: mergedConfig, status: nextStatus, updatedAt: new Date() })
      .where(eq(buildSessions.id, sessionId));

    await writeLog(
      sessionId,
      "clarify",
      "INFO",
      input.confirmComplete ? "澄清完成，进入架构设计" : "已记录澄清答案",
      { answeredKeys: Object.keys(input.answers) },
    );

    return c.json({
      sessionId,
      stage: nextStatus.toLowerCase(),
      completed: input.confirmComplete,
    });
  },
);

/**
 * @openapi
 * GET /agent/:sessionId/stream
 * @summary SSE 流式订阅 Agent 进度
 * @tags agent
 * @security BearerAuth
 */
agentRoutes.get(
  "/:sessionId/stream",
  zValidator("param", sessionIdParam),
  async (c) => {
    const { sessionId } = c.req.valid("param");
    const user = getCurrentUser(c);
    await loadOwnedSession(sessionId, user.id);

    // SSE 长连接：轮询 build_logs 表推送新日志
    return streamSSE(c, async (stream) => {
      let lastLogId: string | null = null;
      const db = getDb();
      const redis = getRedis();

      // 心跳间隔（30 秒）
      const heartbeat = setInterval(async () => {
        try {
          await stream.writeSSE({ event: "ping", data: String(Date.now()) });
        } catch {
          // 连接已断开
        }
      }, 30000);

      // 轮询间隔（2 秒）
      const poll = setInterval(async () => {
        try {
          const logs = await db.query.buildLogs.findMany({
            where: eq(buildLogs.sessionId, sessionId),
            orderBy: [buildLogs.createdAt],
            limit: 50,
          });
          for (const log of logs) {
            if (lastLogId === log.id) continue;
            if (lastLogId) {
              await stream.writeSSE({
                event: "log",
                data: JSON.stringify({
                  id: log.id,
                  agent: log.agent,
                  level: log.level,
                  message: log.message,
                  metadata: log.metadata,
                  createdAt: log.createdAt,
                }),
              });
            }
            lastLogId = log.id;
          }

          // 检查会话状态变化
          const session = await db.query.buildSessions.findFirst({
            where: eq(buildSessions.id, sessionId),
            columns: { status: true, deployUrl: true },
          });
          if (session) {
            if (session.status === "DEPLOYED" || session.status === "ERROR") {
              await stream.writeSSE({
                event: "complete",
                data: JSON.stringify({
                  status: session.status,
                  deployUrl: session.deployUrl,
                }),
              });
              clearInterval(heartbeat);
              clearInterval(poll);
              await stream.close();
            }
          }
        } catch (err) {
          logger.warn({ err, sessionId }, "SSE 轮询失败");
        }
      }, 2000);

      // 等待连接关闭
      c.req.raw.signal?.addEventListener("abort", () => {
        clearInterval(heartbeat);
        clearInterval(poll);
      });

      // 发送初始事件
      await stream.writeSSE({
        event: "connected",
        data: JSON.stringify({ sessionId, timestamp: Date.now() }),
      });

      // 保持连接直到客户端断开或构建完成
      // 注意：streamSSE 会在函数返回后保持连接
      await new Promise((resolve) => {
        const cleanup = () => {
          clearInterval(heartbeat);
          clearInterval(poll);
          resolve(undefined);
        };
        c.req.raw.signal?.addEventListener("abort", cleanup);
        // 超时保护（30 分钟）
        setTimeout(cleanup, 30 * 60 * 1000);
      });
    });
  },
);

/**
 * @openapi
 * POST /agent/:sessionId/chat
 * @summary 对话式修改（streamText）
 * @tags agent
 * @security BearerAuth
 */
agentRoutes.post(
  "/:sessionId/chat",
  zValidator("param", sessionIdParam),
  zValidator("json", chatSchema),
  async (c) => {
    const { sessionId } = c.req.valid("param");
    const input = c.req.valid("json");
    const user = getCurrentUser(c);
    const session = await loadOwnedSession(sessionId, user.id);

    // 构建 AI Provider（根据用户选择的 provider + 环境变量中的 API Key）
    const providerConfig = resolveProvider(input.provider);
    if (!providerConfig) {
      throw new BadRequestError(`Provider ${input.provider} 未配置 API Key`);
    }

    const provider = createOpenAICompatible({
      name: input.provider,
      baseURL: providerConfig.apiBase,
      apiKey: providerConfig.apiKey,
    });

    const model = provider(input.model || providerConfig.defaultModel);

    // 构建对话上下文
    const systemPrompt = buildChatSystemPrompt(session);

    return streamText({
      model,
      system: systemPrompt,
      messages: [{ role: "user", content: input.message }],
      onFinish: async ({ text, usage }) => {
        await writeLog(sessionId, "chat", "INFO", "对话式修改完成", {
          message: input.message,
          responseLength: text.length,
          usage,
        });
      },
    }).toTextStreamResponse();
  },
);

/**
 * 根据 provider 名称解析配置（API Key + Base URL + 默认模型）
 */
function resolveProvider(
  provider: "deepseek" | "kimi" | "doubao" | "qwen" | "glm",
): { apiBase: string; apiKey: string; defaultModel: string } | null {
  switch (provider) {
    case "deepseek":
      return env.DEEPSEEK_API_KEY
        ? { apiBase: "https://api.deepseek.com/v1", apiKey: env.DEEPSEEK_API_KEY, defaultModel: "deepseek-chat" }
        : null;
    case "kimi":
      return env.KIMI_API_KEY
        ? { apiBase: "https://api.moonshot.cn/v1", apiKey: env.KIMI_API_KEY, defaultModel: "moonshot-v1-32k" }
        : null;
    case "doubao":
      return env.DOUBAO_API_KEY
        ? { apiBase: "https://ark.cn-beijing.volces.com/api/v3", apiKey: env.DOUBAO_API_KEY, defaultModel: "doubao-pro-32k" }
        : null;
    case "qwen":
      return env.QWEN_API_KEY
        ? { apiBase: "https://dashscope.aliyuncs.com/compatible-mode/v1", apiKey: env.QWEN_API_KEY, defaultModel: "qwen-plus" }
        : null;
    case "glm":
      return env.GLM_API_KEY
        ? { apiBase: "https://open.bigmodel.cn/api/paas/v4", apiKey: env.GLM_API_KEY, defaultModel: "glm-4-plus" }
        : null;
    default:
      return null;
  }
}

/**
 * 构建对话式修改的系统提示词
 */
function buildChatSystemPrompt(session: {
  productType: string;
  description: string | null;
  config: unknown;
}): string {
  return [
    "你是 LynxKit 的 AI 助手，正在协助用户修改一个已生成的 AI 应用。",
    `产品类型：${session.productType}`,
    `原始需求：${session.description ?? "（未提供）"}`,
    `当前配置：${JSON.stringify(session.config)}`,
    "",
    "请根据用户的修改要求，给出具体的代码改动建议或配置调整方案。",
  ].join("\n");
}
