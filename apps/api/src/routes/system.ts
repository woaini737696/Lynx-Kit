/**
 * 系统路由 - LynxKit API
 *
 * 端点：
 *   GET  /health               系统健康
 *   GET  /templates            列出所有 8 类模板
 *   GET  /templates/:type      获取模板详情
 *   GET  /ai-providers         列出支持的 AI 模型 Provider
 *   POST /ai-providers/test    测试 Provider 连通性（用户填 Key 后测试）
 *   GET  /config               系统配置（公开部分）
 */
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

import { templates } from "@lynxkit/db";
import {
  AI_PROVIDERS,
  testProviderSchema,
} from "@lynxkit/shared";
import { getDb } from "../lib/db.js";
import { getRedis } from "../lib/redis.js";
import { logger } from "../lib/logger.js";
import { BadRequestError, NotFoundError } from "../middleware/error.js";

export const systemRoutes = new Hono();

/**
 * @openapi
 * GET /system/health
 * @summary 系统健康检查（含 DB / Redis 连通性）
 * @tags system
 */
systemRoutes.get("/health", async (c) => {
  const checks: Record<string, "ok" | "fail"> = {};

  // 数据库
  try {
    const db = getDb();
    await db.execute("SELECT 1" as never);
    checks.database = "ok";
  } catch {
    checks.database = "fail";
  }

  // Redis
  const redis = getRedis();
  if (redis) {
    try {
      await redis.ping();
      checks.redis = "ok";
    } catch {
      checks.redis = "fail";
    }
  } else {
    checks.redis = "ok"; // 未配置 Redis 视为通过（降级模式）
  }

  const healthy = Object.values(checks).every((v) => v === "ok");
  return c.json({
    status: healthy ? "ok" : "degraded",
    timestamp: Date.now(),
    checks,
  });
});

/**
 * @openapi
 * GET /system/templates
 * @summary 列出所有 8 类模板
 * @tags system
 */
systemRoutes.get("/templates", async (c) => {
  const db = getDb();

  const allTemplates = await db.query.templates.findMany({
    where: eq(templates.isActive, true),
    orderBy: [templates.type],
  });

  return c.json({ templates: allTemplates, total: allTemplates.length });
});

/**
 * @openapi
 * GET /system/templates/:type
 * @summary 获取模板详情
 * @tags system
 */
systemRoutes.get(
  "/templates/:type",
  zValidator("param", z.object({ type: z.string().min(1) })),
  async (c) => {
    const { type } = c.req.valid("param");
    const db = getDb();

    const typeUpper = type.toUpperCase();
    const validTypes = [
      "SOCIAL", "SYSTEM", "WORKSTATION", "DATA",
      "ADMIN", "APP", "MARKETING", "HARDWARE",
    ];
    if (!validTypes.includes(typeUpper)) {
      throw new BadRequestError(`无效的产品类型：${type}`);
    }

    const template = await db.query.templates.findFirst({
      where: eq(templates.type, typeUpper as never),
    });
    if (!template) {
      throw new NotFoundError("模板");
    }

    return c.json({ template });
  },
);

/**
 * @openapi
 * GET /system/ai-providers
 * @summary 列出支持的 AI 模型 Provider
 * @tags system
 */
systemRoutes.get("/ai-providers", (c) => {
  // 从 @lynxkit/shared 返回 AI_PROVIDERS 常量
  // API Key 是否已配置从环境变量推断
  const providers = AI_PROVIDERS.map((p) => ({
    ...p,
    configured: isProviderConfigured(p.id),
  }));

  return c.json({ providers, total: providers.length });
});

/**
 * @openapi
 * POST /system/ai-providers/test
 * @summary 测试 Provider 连通性（用户填 Key 后测试）
 * @tags system
 */
systemRoutes.post(
  "/ai-providers/test",
  zValidator("json", testProviderSchema),
  async (c) => {
    const input = c.req.valid("json");

    const provider = createOpenAICompatible({
      name: input.provider,
      baseURL: input.apiBase,
      apiKey: input.apiKey,
    });

    const model = provider(input.model);

    try {
      const result = await generateText({
        model,
        prompt: input.prompt,
        maxTokens: 10,
      });

      logger.info(
        { provider: input.provider, model: input.model, usage: result.usage },
        "Provider 连通性测试成功",
      );

      return c.json({
        success: true,
        provider: input.provider,
        model: input.model,
        response: result.text,
        usage: result.usage,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn(
        { provider: input.provider, model: input.model, err: message },
        "Provider 连通性测试失败",
      );

      return c.json({
        success: false,
        provider: input.provider,
        model: input.model,
        error: message,
      });
    }
  },
);

/**
 * @openapi
 * GET /system/config
 * @summary 系统配置（公开部分）
 * @tags system
 */
systemRoutes.get("/config", async (c) => {
  // 返回不影响安全的公开配置
  return c.json({
    platform: {
      name: "LynxKit",
      version: "0.1.0",
      environment: process.env.NODE_ENV ?? "development",
    },
    features: {
      // 功能开关
      storeEnabled: true,
      creatorCenterEnabled: true,
      agentStreaming: true,
      semanticSearch: false, // pgvector 语义检索，需 embeddings 就绪
    },
    limits: {
      // 公开限制信息
      maxConcurrentBuilds: 1,
      maxFileSizeMb: 50,
      maxRetryRounds: 3,
    },
    providers: {
      // 已配置的 Provider 数量（不暴露 Key）
      configured: AI_PROVIDERS.filter((p) => isProviderConfigured(p.id)).length,
      total: AI_PROVIDERS.length,
    },
  });
});

/**
 * 判断 Provider 是否已在环境变量中配置 API Key
 */
function isProviderConfigured(providerId: string): boolean {
  switch (providerId) {
    case "deepseek":
      return !!process.env.DEEPSEEK_API_KEY;
    case "kimi":
      return !!process.env.KIMI_API_KEY;
    case "doubao":
      return !!process.env.DOUBAO_API_KEY;
    case "qwen":
      return !!process.env.QWEN_API_KEY;
    case "glm":
      return !!process.env.GLM_API_KEY;
    case "mimo":
    case "local":
      // 本地模型默认视为可用（桌面端 Ollama）
      return true;
    default:
      return false;
  }
}
