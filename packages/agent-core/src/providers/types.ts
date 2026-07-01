/**
 * LLM 提供商统一接口
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  /** 最大输出 tokens */
  maxTokens?: number;
  /** 温度（0-1，越高越随机） */
  temperature?: number;
  /** 模型标识（如 claude-3-5-haiku-20241022 / claude-3-5-sonnet-20241022） */
  model?: string;
  /** 是否流式响应 */
  stream?: boolean;
}

export interface ChatResponse {
  content: string;
  /** 输入 tokens 数 */
  inputTokens: number;
  /** 输出 tokens 数 */
  outputTokens: number;
  /** 模型 */
  model: string;
  /** 耗时（毫秒） */
  durationMs: number;
}

export interface LLMProvider {
  /** 提供商名称 */
  readonly name: string;

  /**
   * 同步对话
   */
  chat(request: ChatRequest): Promise<ChatResponse>;

  /**
   * 流式对话（返回 async generator）
   * TODO: Week 2 实现
   */
  chatStream?(request: ChatRequest): AsyncGenerator<string, void, unknown>;

  /**
   * 健康检查（验证 API Key 是否有效）
   */
  healthCheck(): Promise<boolean>;
}

/**
 * LLM 配置
 */
export interface LLMConfig {
  provider: "anthropic" | "openai" | "deepseek" | "mock";
  apiKey?: string;
  /** 默认模型 */
  defaultModel?: string;
  /** 请求超时（毫秒） */
  timeout?: number;
  /** 最大重试次数 */
  maxRetries?: number;
}

/**
 * LLM 错误
 */
export class LLMError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "AUTH_FAILED"
      | "RATE_LIMITED"
      | "MODEL_NOT_FOUND"
      | "TIMEOUT"
      | "INVALID_RESPONSE"
      | "PROVIDER_ERROR" = "PROVIDER_ERROR",
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = "LLMError";
  }
}
