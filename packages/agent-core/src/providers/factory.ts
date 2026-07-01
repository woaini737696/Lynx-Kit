import type { LLMConfig, LLMProvider } from "./types.js";
import { AnthropicProvider } from "./anthropic.js";
import { MockProvider } from "./mock.js";

/**
 * LLM 提供商工厂
 *
 * 根据配置创建对应的 LLMProvider 实例。
 * 优先使用 Anthropic，无 API Key 时降级到 Mock。
 */
export function createLLMProvider(config: LLMConfig): LLMProvider {
  switch (config.provider) {
    case "anthropic":
      if (!config.apiKey) {
        console.warn(
          "[agent-core] 未配置 ANTHROPIC_API_KEY，降级到 MockProvider"
        );
        return new MockProvider();
      }
      return new AnthropicProvider({
        apiKey: config.apiKey,
        defaultModel: config.defaultModel,
        timeout: config.timeout,
        maxRetries: config.maxRetries,
      });

    case "openai":
      // TODO: Week 2 实现 OpenAIProvider
      throw new Error("OpenAI provider 尚未实现");

    case "deepseek":
      // TODO: Week 2 实现 DeepSeekProvider（用于多模型负载均衡降级）
      throw new Error("DeepSeek provider 尚未实现");

    case "mock":
      return new MockProvider();

    default:
      return new MockProvider();
  }
}
