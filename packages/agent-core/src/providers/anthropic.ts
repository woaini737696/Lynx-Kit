import Anthropic from "@anthropic-ai/sdk";
import type { ChatRequest, ChatResponse, LLMProvider } from "./types.js";
import { LLMError } from "./types.js";

/**
 * Anthropic Claude 提供商实现
 *
 * 模型推荐：
 * - claude-3-5-haiku-20241022：意图识别（成本低）
 * - claude-3-5-sonnet-20241022：代码生成 + 修复（质量高）
 */
export class AnthropicProvider implements LLMProvider {
  readonly name = "anthropic";
  private readonly client: Anthropic;
  private readonly defaultModel: string;
  private readonly timeout: number;
  private readonly maxRetries: number;

  constructor(config: {
    apiKey: string;
    defaultModel?: string;
    timeout?: number;
    maxRetries?: number;
  }) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
      timeout: config.timeout ?? 60_000,
      maxRetries: config.maxRetries ?? 2,
    });
    this.defaultModel = config.defaultModel ?? "claude-3-5-sonnet-20241022";
    this.timeout = config.timeout ?? 60_000;
    this.maxRetries = config.maxRetries ?? 2;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();
    const model = request.model ?? this.defaultModel;

    try {
      const [systemMessage, ...messages] = this.extractSystem(request.messages);
      const response = await this.client.messages.create({
        model,
        max_tokens: request.maxTokens ?? 4096,
        temperature: request.temperature ?? 0.7,
        system: systemMessage,
        messages: messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      });

      const content = response.content
        .map((block) => (block.type === "text" ? block.text : ""))
        .join("");

      return {
        content,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        model: response.model,
        durationMs: Date.now() - startTime,
      };
    } catch (err) {
      throw this.toLLMError(err);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // 发送最便宜的消息测试
      await this.client.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 1,
        messages: [{ role: "user", content: "ping" }],
      });
      return true;
    } catch {
      return false;
    }
  }

  private extractSystem(messages: ChatRequest["messages"]): [string, ...ChatRequest["messages"]] {
    const systemMsgs = messages.filter((m) => m.role === "system");
    const others = messages.filter((m) => m.role !== "system");
    const system = systemMsgs.map((m) => m.content).join("\n\n");
    return [system, ...others];
  }

  private toLLMError(err: unknown): LLMError {
    if (err instanceof Anthropic.APIError) {
      if (err.status === 401) {
        return new LLMError("Anthropic API Key 无效", "AUTH_FAILED", 401);
      }
      if (err.status === 429) {
        return new LLMError("Anthropic API 限流，请稍后重试", "RATE_LIMITED", 429);
      }
      if (err.status === 404) {
        return new LLMError("模型不存在", "MODEL_NOT_FOUND", 404);
      }
      return new LLMError(err.message, "PROVIDER_ERROR", err.status);
    }
    return new LLMError(
      err instanceof Error ? err.message : String(err),
      "PROVIDER_ERROR"
    );
  }
}
