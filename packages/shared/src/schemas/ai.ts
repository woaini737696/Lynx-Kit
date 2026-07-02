/**
 * AI Provider 配置 Zod schema - LynxKit v1.0
 */

import { z } from "zod";
import { AIProvider } from "../types/ai";

/**
 * AI Provider schema
 */
export const aiProviderSchema = z.nativeEnum(AIProvider);

/**
 * 模型能力 schema
 */
export const modelCapabilitySchema = z.enum([
  "code",
  "reasoning",
  "chat",
  "vision",
  "long-context",
]);

/**
 * AI Provider 配置（用户侧）
 */
export const aiModelConfigSchema = z.object({
  provider: aiProviderSchema,
  apiKey: z.string().min(1, "API Key 不能为空"),
  apiBase: z.string().url("API 地址格式错误"),
  model: z.string().min(1, "请选择模型"),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().max(32768).optional(),
});

/**
 * 仅保存 Provider 配置（不含温度等高级选项）
 */
export const saveProviderConfigSchema = z.object({
  provider: aiProviderSchema,
  apiKey: z.string().min(1, "API Key 不能为空"),
  apiBase: z.string().url("API 地址格式错误"),
  model: z.string().min(1, "请选择模型"),
});

/**
 * 测试 Provider 连通性
 */
export const testProviderSchema = z.object({
  provider: aiProviderSchema,
  apiKey: z.string().min(1, "API Key 不能为空"),
  apiBase: z.string().url("API 地址格式错误"),
  model: z.string().min(1, "请选择模型"),
  /** 测试 prompt，默认 "ping" */
  prompt: z.string().max(200).optional().default("ping"),
});

/**
 * 批量保存 Provider 配置
 */
export const batchSaveProvidersSchema = z.object({
  configs: z.array(aiModelConfigSchema).min(1, "至少配置一个 Provider"),
});

/**
 * 设置默认 Provider（用于 9 层 Agent 默认调用）
 */
export const setDefaultProviderSchema = z.object({
  provider: aiProviderSchema,
  /** 应用到哪些 Agent 角色（不填则全部） */
  applyToAgents: z.array(z.string()).optional(),
});
