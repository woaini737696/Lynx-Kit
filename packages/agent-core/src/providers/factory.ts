/**
 * 模型工厂 - LynxKit agent-core
 *
 * 基于 Vercel AI SDK 5.0 的 @ai-sdk/openai-compatible，按用户配置的
 * AIModelConfig 创建 LanguageModel 实例。
 *
 * 国内 6 大模型 Provider（DeepSeek / Kimi / Doubao / Qwen / GLM / Mimo）
 * 全部兼容 OpenAI 协议，因此统一走 openai-compatible 适配层。
 *
 * 所有 Agent 的 LLM 调用都必须经由此处 createModel，便于：
 *   - 集中注入 baseURL / apiKey / 请求头
 *   - 统一切换 Provider 与模型
 *   - 后续接入流量观测与重试
 */

import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";
import {
  AIProvider,
  AGENTS,
  AI_PROVIDERS,
  type AIModelConfig,
  type ProviderMeta,
} from "@lynxkit/shared";
import { AgentRole } from "@lynxkit/shared";

/**
 * 按用户配置创建一个 AI SDK LanguageModel 实例
 *
 * @param config 用户侧模型配置（provider / apiKey / apiBase / model / temperature / maxTokens）
 */
export function createModel(config: AIModelConfig): LanguageModel {
  const provider = AI_PROVIDERS.find((p) => p.id === config.provider);
  if (!provider) {
    throw new Error(`[agent-core] 未知的 Provider：${config.provider}`);
  }

  const baseURL = config.apiBase || provider.apiBase;
  // 本地模型（Ollama / Mimo）无需 apiKey，给一个占位值以满足 SDK 签名
  const apiKey =
    config.apiKey || (provider.isLocal ? "local-no-key-required" : "");

  if (!apiKey) {
    throw new Error(
      `[agent-core] Provider ${config.provider}（${provider.name}）缺少 apiKey，请在设置中配置`,
    );
  }

  const openaiProvider = createOpenAICompatible({
    name: config.provider,
    baseURL,
    apiKey,
  });

  return openaiProvider(config.model);
}

/**
 * 默认模型组合
 *
 * 当用户未在会话中显式指定 modelConfig 时，按 Agent 角色回退到平台默认配置。
 * 元数据来自 @lynxkit/shared 的 AGENTS（defaultModel）与 AI_PROVIDERS（apiBase）。
 *
 * 注意：默认配置中 apiKey 为空字符串，实际生产应由用户必填后覆盖，
 * 否则调用 LLM 时会在 resolveModel 阶段抛出。
 */
export const DEFAULT_MODEL_CONFIG: Partial<Record<AgentRole, AIModelConfig>> =
  Object.fromEntries(
    AGENTS.map((agent) => {
      const providerMeta: ProviderMeta | undefined = AI_PROVIDERS.find(
        (p) => p.id === agent.defaultModel.provider,
      );
      const cfg: AIModelConfig = {
        provider: agent.defaultModel.provider,
        apiKey: "",
        apiBase: providerMeta?.apiBase ?? "",
        model: agent.defaultModel.model,
        temperature: 0.3,
        maxTokens: 8192,
      };
      return [agent.id, cfg];
    }),
  ) as Partial<Record<AgentRole, AIModelConfig>>;

/**
 * 判断给定 Provider 是否为本地模型（无需 apiKey）
 */
export function isLocalProvider(provider: AIProvider): boolean {
  const meta = AI_PROVIDERS.find((p) => p.id === provider);
  return Boolean(meta?.isLocal);
}
