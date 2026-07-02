/**
 * Agent 流式 API
 *
 * 直接面向 9 层 Agent 编排引擎的流式接口，支持：
 * - 提交任务并接收 SSE 流式响应
 * - 取消正在执行的 Agent 任务
 * - 查询 Agent 任务状态
 */
import type { ApiClient } from "./client.js";
import type { AgentLog } from "@lynxkit/shared";
import type { StartAgentInput, AgentTask } from "./types.js";

export class AgentApi {
  constructor(private readonly client: ApiClient) {}

  /** 提交并启动 Agent 任务，返回任务句柄 */
  async start(input: StartAgentInput): Promise<AgentTask> {
    return this.client.post<AgentTask>("/v1/agent/start", input);
  }

  /** 查询 Agent 任务状态 */
  async getStatus(taskId: string): Promise<AgentTask> {
    return this.client.get<AgentTask>(`/v1/agent/${taskId}`);
  }

  /** 取消正在执行的 Agent 任务 */
  async cancel(taskId: string): Promise<{ ok: boolean }> {
    return this.client.post<{ ok: boolean }>(`/v1/agent/${taskId}/cancel`);
  }

  /** 获取 Agent 任务的执行日志 */
  async getLogs(taskId: string): Promise<AgentLog[]> {
    return this.client.get<AgentLog[]>(`/v1/agent/${taskId}/logs`);
  }

  /**
   * 订阅 Agent 任务的 SSE 流式响应
   *
   * 返回逐条解析后的事件字符串（`data: ` 之后的负载）。
   * 若需结构化事件，可对 yield 出的字符串做 `JSON.parse` 得到 `AgentStreamEvent`。
   *
   * ```ts
   * for await (const raw of agent.stream(taskId)) {
   *   const event: AgentStreamEvent = JSON.parse(raw);
   * }
   * ```
   */
  async *stream(taskId: string): AsyncGenerator<string> {
    yield* this.client.stream(`/v1/agent/${taskId}/stream`, {});
  }
}
