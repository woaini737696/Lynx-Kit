/**
 * 构建会话 API
 *
 * 封装 LynxKit 9 层 Agent 构建流程的会话管理：
 * 创建 / 查询 / 列表 / 更新配置 / 启动构建 / 获取日志 / 版本回滚 / 流式订阅。
 *
 * 实体类型 BuildSession / AgentLog 等来自 @lynxkit/shared。
 */
import type { ApiClient } from "./client.js";
import type { BuildSession, AgentLog } from "@lynxkit/shared";
import type {
  CreateBuildInput,
  UpdateBuildConfigInput,
  StartBuildResult,
} from "./types.js";

export class BuildApi {
  constructor(private readonly client: ApiClient) {}

  /** 创建构建会话 */
  async create(input: CreateBuildInput): Promise<BuildSession> {
    return this.client.post<BuildSession>("/v1/build", input);
  }

  /** 按 ID 获取构建会话 */
  async getById(id: string): Promise<BuildSession> {
    return this.client.get<BuildSession>(`/v1/build/${id}`);
  }

  /** 列出当前用户的构建会话 */
  async list(): Promise<BuildSession[]> {
    return this.client.get<BuildSession[]>("/v1/build");
  }

  /** 更新构建会话配置（增量 patch） */
  async updateConfig(
    id: string,
    input: UpdateBuildConfigInput,
  ): Promise<BuildSession> {
    return this.client.put<BuildSession>(`/v1/build/${id}/config`, {
      sessionId: id,
      ...input,
    });
  }

  /** 启动构建 */
  async start(id: string): Promise<StartBuildResult> {
    return this.client.post<StartBuildResult>(`/v1/build/${id}/start`);
  }

  /** 获取构建会话的 Agent 执行日志 */
  async getLogs(id: string): Promise<AgentLog[]> {
    return this.client.get<AgentLog[]>(`/v1/build/${id}/logs`);
  }

  /** 回滚到指定版本 */
  async rollback(id: string, version: number): Promise<BuildSession> {
    return this.client.post<BuildSession>(
      `/v1/build/${id}/rollback`,
      { version },
    );
  }

  /** 删除构建会话 */
  async remove(id: string): Promise<{ ok: boolean }> {
    return this.client.delete<{ ok: boolean }>(`/v1/build/${id}`);
  }

  /**
   * 订阅构建会话的 Agent 流式响应（SSE）
   *
   * ```ts
   * for await (const chunk of build.streamAgent(sessionId)) {
   *   console.log(chunk);
   * }
   * ```
   */
  async *streamAgent(id: string): AsyncGenerator<string> {
    yield* this.client.stream(`/v1/build/${id}/stream`, {});
  }
}
