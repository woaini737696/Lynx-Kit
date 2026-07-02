/**
 * AI 模型配置 API
 *
 * 对齐后端 apps/api/src/routes/system.ts 中已有的 AI Provider 端点：
 *   GET  /v1/system/ai-providers         列出支持的 AI Provider（含 configured 标志）
 *   POST /v1/system/ai-providers/test    测试 Provider 连通性
 *
 * MVP 阶段：API Key 等敏感配置由客户端（桌面端 useAIConfigStore + localStorage）持久化，
 * 后端仅提供 Provider 元数据与连通性测试能力。save / setDefault 等写入方法为本地操作，
 * 返回占位响应以保持前端 Hook 调用契约不变。
 */
import type { ApiClient } from "./client";
import type { AIProvider, AIModelConfig } from "@lynxkit/shared";
import type { UpsertAiModelInput, TestAiModelResult } from "./types";

export class AiApi {
  constructor(private readonly client: ApiClient) {}

  /**
   * 列出所有已配置的 AI 模型
   *
   * 后端 /v1/system/ai-providers 返回 `{ providers: ProviderMeta[] }`，
   * 每个 ProviderMeta 含 id / name / apiBase / defaultModel / configured。
   * 此处映射为 AIModelConfig[]，apiKey 用空串占位（实际 Key 由客户端本地存储）。
   */
  async list(): Promise<AIModelConfig[]> {
    const data = await this.client.get<{
      providers: Array<{
        id: AIProvider;
        name: string;
        apiBase: string;
        defaultModel: string;
        configured: boolean;
      }>;
      total: number;
    }>("/v1/system/ai-providers");

    return (data.providers ?? []).map((p) => ({
      provider: p.id,
      apiKey: "",
      apiBase: p.apiBase,
      model: p.defaultModel,
    }));
  }

  /** 按 Provider 获取模型配置（基于 list 过滤） */
  async getByProvider(provider: AIProvider): Promise<AIModelConfig | null> {
    const list = await this.list();
    return list.find((c) => c.provider === provider) ?? null;
  }

  /**
   * 保存模型配置（新增或更新）
   *
   * MVP 阶段：客户端本地 zustand store 持久化，后端无写入端点。
   * 直接返回 input 作为已保存的配置，保持前端 Hook 契约不变。
   */
  async save(input: UpsertAiModelInput): Promise<AIModelConfig> {
    return {
      provider: input.provider,
      apiKey: input.apiKey,
      apiBase: input.apiBase,
      model: input.model,
      temperature: input.temperature,
      maxTokens: input.maxTokens,
    };
  }

  /** 批量保存模型配置（本地循环调用 save） */
  async batchSave(inputs: UpsertAiModelInput[]): Promise<AIModelConfig[]> {
    return inputs.map((input) => ({
      provider: input.provider,
      apiKey: input.apiKey,
      apiBase: input.apiBase,
      model: input.model,
      temperature: input.temperature,
      maxTokens: input.maxTokens,
    }));
  }

  /** 删除模型配置（本地操作，返回成功） */
  async remove(_provider: AIProvider): Promise<{ ok: boolean }> {
    return { ok: true };
  }

  /**
   * 测试模型连通性
   *
   * 后端 POST /v1/system/ai-providers/test 返回：
   *   成功：{ success: true, provider, model, response, usage }
   *   失败：{ success: false, provider, model, error }
   * 此处映射为 TestAiModelResult。
   */
  async test(input: UpsertAiModelInput): Promise<TestAiModelResult> {
    const start = Date.now();
    try {
      const data = await this.client.post<{
        success: boolean;
        provider: string;
        model: string;
        response?: string;
        error?: string;
      }>("/v1/system/ai-providers/test", {
        provider: input.provider,
        apiBase: input.apiBase,
        apiKey: input.apiKey,
        model: input.model,
        prompt: "ping",
      });

      return {
        ok: !!data.success,
        latencyMs: Date.now() - start,
        sample: data.response,
        error: data.error,
      };
    } catch (err) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * 设为默认 Provider
   *
   * MVP 阶段：本地 store 维护 activeProvider，后端无对应端点。
   * 返回 { ok: true } 保持前端 Hook 契约。
   */
  async setDefault(
    _provider: AIProvider,
    _applyToAgents?: string[],
  ): Promise<{ ok: boolean }> {
    return { ok: true };
  }
}
