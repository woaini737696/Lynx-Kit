/**
 * 构建会话 API
 *
 * 封装 LynxKit 9 层 Agent 构建流程的会话管理：
 * 创建 / 查询 / 列表 / 更新配置 / 启动构建 / 获取日志 / 版本回滚 / 流式订阅。
 *
 * 路径对齐后端 apps/api/src/routes/build.ts，后端响应带包裹层（{session}/{sessions}/{logs}），
 * 此处统一解包返回裸实体。
 *
 * 实体类型 BuildSession / AgentLog 等来自 @lynxkit/shared。
 */
import type { ApiClient } from "./client";
import type { BuildSession, AgentLog } from "@lynxkit/shared";
import type {
  CreateBuildInput,
  UpdateBuildConfigInput,
  StartBuildResult,
} from "./types";

export class BuildApi {
  constructor(private readonly client: ApiClient) {}

  /** 创建构建会话 */
  async create(input: CreateBuildInput): Promise<BuildSession> {
    const data = await this.client.post<{ session: BuildSession }>(
      "/v1/build",
      input,
    );
    return data.session;
  }

  /** 按 ID 获取构建会话 */
  async getById(id: string): Promise<BuildSession> {
    const data = await this.client.get<{ session: BuildSession }>(
      `/v1/build/${id}`,
    );
    return data.session;
  }

  /** 列出当前用户的构建会话 */
  async list(): Promise<BuildSession[]> {
    const data = await this.client.get<{ sessions: BuildSession[]; total: number }>(
      "/v1/build",
    );
    return data.sessions ?? [];
  }

  /** 更新构建会话配置（增量 patch） */
  async updateConfig(
    id: string,
    input: UpdateBuildConfigInput,
  ): Promise<BuildSession> {
    const data = await this.client.put<{ session: BuildSession }>(
      `/v1/build/${id}/config`,
      input,
    );
    return data.session;
  }

  /** 启动构建 */
  async start(id: string): Promise<StartBuildResult> {
    const data = await this.client.post<{ streamUrl: string; session: BuildSession }>(
      `/v1/build/${id}/start`,
    );
    return {
      ok: true,
      sessionId: id,
      streamUrl: data.streamUrl ?? `/v1/agent/${id}/stream`,
    } as StartBuildResult;
  }

  /** 获取构建会话的 Agent 执行日志 */
  async getLogs(id: string): Promise<AgentLog[]> {
    const data = await this.client.get<{ logs: AgentLog[]; total: number }>(
      `/v1/build/${id}/logs`,
    );
    return data.logs ?? [];
  }

  /** 回滚到指定版本 */
  async rollback(id: string, version: number): Promise<BuildSession> {
    const data = await this.client.post<{ session: BuildSession }>(
      `/v1/build/${id}/rollback`,
      { versionId: String(version) },
    );
    return data.session;
  }

  /** 删除构建会话 */
  async remove(id: string): Promise<{ ok: boolean }> {
    const data = await this.client.delete<{ deleted: boolean }>(
      `/v1/build/${id}`,
    );
    return { ok: !!data.deleted };
  }

  /**
   * 订阅构建会话的 Agent 流式响应（SSE）
   * 后端实际路径为 GET /v1/agent/:sessionId/stream
   */
  async *streamAgent(id: string): AsyncGenerator<string> {
    yield* this.client.getStream(`/v1/agent/${id}/stream`);
  }
}
