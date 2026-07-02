/**
 * Agent 流式 API
 *
 * 对齐后端 apps/api/src/routes/agent.ts，全部以 sessionId（构建会话 ID）为参数：
 *   POST /v1/agent/:sessionId/start           启动 Agent 流程（SSE 返回 started/done 事件）
 *   POST /v1/agent/:sessionId/clarify         获取需求澄清问题
 *   POST /v1/agent/:sessionId/clarify-answer  提交澄清答案
 *   GET  /v1/agent/:sessionId/stream          SSE 流式订阅 Agent 进度
 *   POST /v1/agent/:sessionId/chat            对话式修改（streamText）
 */
import type { ApiClient } from "./client";

export interface StartAgentOptions {
  serverId?: string;
  domain?: string;
  answers?: Record<string, unknown>;
}

export interface ClarifyAnswerInput {
  answers: Record<string, unknown>;
  confirmComplete?: boolean;
}

export interface ChatInput {
  message: string;
  provider?: "deepseek" | "kimi" | "doubao" | "qwen" | "glm";
  model?: string;
}

export interface ClarifyQuestion {
  id: string;
  question: string;
  type: "text" | "select" | "multiselect";
  options?: string[];
  required: boolean;
}

export class AgentApi {
  constructor(private readonly client: ApiClient) {}

  /** 启动 Agent 流程（返回 SSE 流，包含 started/done 事件） */
  async *start(
    sessionId: string,
    input: StartAgentOptions = {},
  ): AsyncGenerator<string> {
    yield* this.client.stream(`/v1/agent/${sessionId}/start`, input);
  }

  /** 获取需求澄清问题 */
  async clarify(sessionId: string): Promise<{
    sessionId: string;
    stage: string;
    questions: ClarifyQuestion[];
  }> {
    return this.client.post(`/v1/agent/${sessionId}/clarify`, {});
  }

  /** 提交澄清答案 */
  async submitClarify(
    sessionId: string,
    input: ClarifyAnswerInput,
  ): Promise<{ sessionId: string; stage: string; completed: boolean }> {
    return this.client.post(`/v1/agent/${sessionId}/clarify-answer`, input);
  }

  /** SSE 流式订阅 Agent 进度（GET 方式，长连接） */
  async *stream(sessionId: string): AsyncGenerator<string> {
    yield* this.client.getStream(`/v1/agent/${sessionId}/stream`);
  }

  /**
   * 对话式修改（后端返回 text/plain 流式响应）
   *
   * 注意：后端使用 streamText().toTextStreamResponse() 返回纯文本流，
   * 不是 SSE 也不是 JSON。这里返回原始 Response，由调用方自行读取
   * `response.body` 的 ReadableStream。
   */
  async chat(sessionId: string, input: ChatInput): Promise<Response> {
    const baseUrl = (this.client as unknown as { opts: { baseUrl: string } }).opts.baseUrl;
    const token = (this.client as unknown as { opts: { getToken?: () => string | null } }).opts.getToken?.();
    const url = `${baseUrl}/v1/agent/${sessionId}/chat`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(input),
    });
  }
}
