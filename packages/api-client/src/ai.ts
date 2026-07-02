/**
 * AI 模型配置 API
 *
 * 封装平台 AI 模型供应商的配置管理：增删改查、连通性测试、设为默认。
 * 实体类型 AIProvider / AIModelConfig 来自 @lynxkit/shared。
 */
import type { ApiClient } from "./client.js";
import type { AIProvider, AIModelConfig } from "@lynxkit/shared";
import type { UpsertAiModelInput, TestAiModelResult } from "./types.js";

export class AiApi {
  constructor(private readonly client: ApiClient) {}

  /** 列出所有已配置的 AI 模型 */
  async list(): Promise<AIModelConfig[]> {
    return this.client.get<AIModelConfig[]>("/v1/ai/models");
  }

  /** 按 Provider 获取模型配置 */
  async getByProvider(provider: AIProvider): Promise<AIModelConfig> {
    return this.client.get<AIModelConfig>(`/v1/ai/models/${provider}`);
  }

  /** 保存模型配置（新增或更新） */
  async save(input: UpsertAiModelInput): Promise<AIModelConfig> {
    return this.client.post<AIModelConfig>("/v1/ai/models", input);
  }

  /** 批量保存模型配置 */
  async batchSave(inputs: UpsertAiModelInput[]): Promise<AIModelConfig[]> {
    return this.client.post<AIModelConfig[]>("/v1/ai/models/batch", {
      configs: inputs,
    });
  }

  /** 删除模型配置 */
  async remove(provider: AIProvider): Promise<{ ok: boolean }> {
    return this.client.delete<{ ok: boolean }>(`/v1/ai/models/${provider}`);
  }

  /** 测试模型连通性 */
  async test(input: UpsertAiModelInput): Promise<TestAiModelResult> {
    return this.client.post<TestAiModelResult>("/v1/ai/test", input);
  }

  /** 设为默认 Provider（用于 9 层 Agent 默认调用） */
  async setDefault(
    provider: AIProvider,
    applyToAgents?: string[],
  ): Promise<{ ok: boolean }> {
    return this.client.post<{ ok: boolean }>("/v1/ai/default", {
      provider,
      applyToAgents,
    });
  }
}
