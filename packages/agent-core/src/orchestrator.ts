/**
 * 编排引擎核心 - LynxKit agent-core
 *
 * 9 层 Agent 编排引擎（Vercel AI SDK 5.0 + 国内 6 大模型 Provider + BullMQ）。
 *
 * 流水线（与 @lynxkit/shared AGENTS 元数据对齐）：
 *   ① 意图识别 → ② 架构师 → ③ 需求澄清
 *     ↓
 *   ④ 产品经理 ∥ ⑤ 设计师 （并行）
 *     ↓
 *   ⑥ 前端开发 → ⑦ 后端开发 → ⑧ AI 集成 （串行）
 *     ↓
 *   ⑨ 测试修复 （循环，最多 3 轮）
 *     ↓
 *   ⑩ 部署发布
 *
 * 设计要点：
 *   - 状态机驱动：每个 Agent 输入/输出明确，便于断点续跑与观测
 *   - 串行 / 并行混合：④⑤ 并行，其余串行
 *   - 错误处理：单个 Agent 失败时记录日志并抛出，由上层决定重试 / 回滚
 *   - 全程可观测：通过 onLog / onProgress / onStream 回调实时上报
 */

import {
  AgentRole,
  LogLevel,
  type AgentLog,
  type AIModelConfig,
} from "@lynxkit/shared";
import type { DeployerAdapter, GeneratedFile } from "./types.js";
import {
  AIIntegrationAgent,
  ArchitectAgent,
  BackendDevAgent,
  ClarifyAgent,
  DeployAgent,
  DesignerAgent,
  FrontendDevAgent,
  IntentAgent,
  ProductManagerAgent,
  TestFixAgent,
} from "./agents/index.js";

/**
 * 编排器上下文
 *
 * 由调用方（API 层 / BullMQ Worker）构造并注入。
 */
export interface OrchestratorContext {
  /** 构建会话 ID */
  sessionId: string;
  /** 所属用户 ID */
  userId: string;
  /** 用户输入的灵感描述（自然语言） */
  inspiration: string;
  /** 用户在 ③ 澄清阶段的回答（断点续跑时传入） */
  answers?: Record<string, unknown>;
  /**
   * 会话级模型配置。缺省时各 Agent 回退到 DEFAULT_MODEL_CONFIG[role]。
   * 实际生产应要求用户必填 apiKey。
   */
  modelConfig?: AIModelConfig;
  /** 工作区根目录（⑨ 测试修复写盘 + 执行 tsc / ⑩ 部署所需） */
  workspace?: string;
  /** 部署适配器（⑩ 部署所需，未注入则返回本地预览 URL） */
  deployer?: DeployerAdapter;
  /** Agent 日志回调 */
  onLog: (log: AgentLog) => void;
  /** Agent 进度回调（0~100） */
  onProgress: (agent: AgentRole, progress: number) => void;
  /** 流式输出回调 */
  onStream: (chunk: string) => void;
}

/**
 * 编排器最终产物
 */
export interface OrchestratorResult {
  productType: string;
  architecture: unknown;
  generatedFiles: GeneratedFile[];
  deployUrl?: string;
  /** ⑨ 测试修复是否通过 */
  testPassed: boolean;
  /** ⑨ 触发的修复等级 */
  fixLevel?: string;
}

export class Orchestrator {
  constructor(private ctx: OrchestratorContext) {}

  /**
   * 执行完整 9 层编排流水线
   */
  async run(): Promise<OrchestratorResult> {
    // ① 串行：意图识别
    const intent = await this.step(AgentRole.INTENT, () =>
      new IntentAgent(this.ctx).run(),
    );
    this.ctx.onProgress(AgentRole.INTENT, 100);

    // ② 串行：架构师
    const architecture = await this.step(AgentRole.ARCHITECT, () =>
      new ArchitectAgent(this.ctx, intent).run(),
    );
    this.ctx.onProgress(AgentRole.ARCHITECT, 100);

    // ③ 串行：需求澄清
    const clarification = await this.step(AgentRole.CLARIFY, () =>
      new ClarifyAgent(this.ctx, intent).run(),
    );
    // 把澄清答案回填到 ctx，供后续 Agent 使用
    this.ctx.answers = { ...this.ctx.answers, ...clarification.answers };
    this.ctx.onProgress(AgentRole.CLARIFY, 100);

    // ④ ⑤ 并行：产品经理 + 设计师
    const [pm, designer] = await Promise.all([
      this.step(AgentRole.PRODUCT_MANAGER, () =>
        new ProductManagerAgent(this.ctx, intent, architecture, clarification).run(),
      ),
      this.step(AgentRole.DESIGNER, () =>
        new DesignerAgent(this.ctx, intent).run(),
      ),
    ]);
    this.ctx.onProgress(AgentRole.PRODUCT_MANAGER, 100);
    this.ctx.onProgress(AgentRole.DESIGNER, 100);

    // ⑥ 串行：前端开发
    const frontend = await this.step(AgentRole.FRONTEND_DEV, () =>
      new FrontendDevAgent(this.ctx, pm, designer, architecture).run(),
    );
    this.ctx.onProgress(AgentRole.FRONTEND_DEV, 100);

    // ⑦ 串行：后端开发
    const backend = await this.step(AgentRole.BACKEND_DEV, () =>
      new BackendDevAgent(this.ctx, pm, architecture).run(),
    );
    this.ctx.onProgress(AgentRole.BACKEND_DEV, 100);

    // ⑧ 串行：AI 集成
    const aiIntegration = await this.step(AgentRole.AI_INTEGRATION, () =>
      new AIIntegrationAgent(this.ctx, pm).run(),
    );
    this.ctx.onProgress(AgentRole.AI_INTEGRATION, 100);

    // ⑨ 循环：测试修复（循环逻辑封装在 Agent 内，最多 3 轮）
    const testResult = await this.step(AgentRole.TEST_FIX, () =>
      new TestFixAgent(this.ctx, { frontend, backend }).run(),
    );
    this.ctx.onProgress(AgentRole.TEST_FIX, 100);

    // 合并 ⑥⑦⑧ 产物，并以 ⑨ 修复后的版本为准
    const generatedFiles = mergeFiles(
      [...frontend.files, ...backend.files, ...aiIntegration.files],
      testResult.fixedFiles,
    );

    // ⑩ 串行：部署发布
    const deploy = await this.step(AgentRole.DEPLOY, () =>
      new DeployAgent(this.ctx, generatedFiles).run(),
    );
    this.ctx.onProgress(AgentRole.DEPLOY, 100);

    return {
      productType: intent.productType,
      architecture,
      generatedFiles,
      deployUrl: deploy.url,
      testPassed: testResult.success,
      fixLevel: testResult.fixLevel,
    };
  }

  /**
   * 包裹单个 Agent 执行，统一处理进度归零、错误日志与异常上抛
   */
  private async step<T>(
    role: AgentRole,
    fn: () => Promise<T>,
  ): Promise<T> {
    this.ctx.onProgress(role, 0);
    const start = Date.now();
    try {
      return await fn();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.ctx.onLog({
        id: `err_${this.ctx.sessionId}_${role}_${Date.now()}`,
        sessionId: this.ctx.sessionId,
        agent: role,
        level: LogLevel.ERROR,
        message,
        metadata: {
          durationMs: Date.now() - start,
          stack: err instanceof Error ? err.stack : undefined,
        },
        createdAt: new Date().toISOString(),
      });
      throw err;
    }
  }
}

/**
 * 用 fixed 中的同名文件覆盖 originals
 */
function mergeFiles(
  originals: GeneratedFile[],
  fixed: GeneratedFile[],
): GeneratedFile[] {
  const map = new Map<string, GeneratedFile>();
  for (const f of originals) map.set(f.path, f);
  for (const f of fixed) map.set(f.path, f);
  return [...map.values()];
}
