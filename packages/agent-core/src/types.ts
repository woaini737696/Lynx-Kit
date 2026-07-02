/**
 * 引擎内部类型 - LynxKit agent-core
 *
 * 定义编排引擎运行期的通用类型与 BaseAgent 基类。
 * 公共类型（AgentRole / AgentLog / AIModelConfig 等）来自 @lynxkit/shared。
 *
 * 注意：OrchestratorContext 定义在 ./orchestrator.ts，此处仅以
 * `import type` 引用（类型层依赖，不会产生运行期循环依赖）。
 */

import type { LanguageModel } from "ai";
import {
  createLogId,
  type AgentLog,
  type AgentRole,
  type AIModelConfig,
  type LogLevel,
} from "@lynxkit/shared";
import type { OrchestratorContext } from "./orchestrator.js";
import { createModel, DEFAULT_MODEL_CONFIG, isLocalProvider } from "./providers/factory.js";

/**
 * 生成代码文件（引擎内部统一表示）
 */
export interface GeneratedFile {
  /** 文件相对路径，如 `src/pages/index.tsx` */
  path: string;
  /** 文件内容 */
  content: string;
  /** 编程语言，如 `typescript` / `tsx` / `sql` */
  language: string;
}

/**
 * 部署适配器接口
 *
 * ⑩ 部署 Agent 通过此接口把产物发布到目标环境（Vercel / 自托管服务器 / 桌面端打包）。
 * 由调用方（API 层）注入具体实现，引擎本身不绑定 SSH / Docker 细节。
 */
export interface DeployerAdapter {
  deploy(opts: {
    sessionId: string;
    files: GeneratedFile[];
    workspace: string;
  }): Promise<{ url: string }>;
}

/**
 * 测试修复等级（引擎内部使用，与 shared.FixLevel 对齐）
 */
export type { FixLevel } from "@lynxkit/shared";

/**
 * 根据文件扩展名推断语言标识
 */
export function inferLanguage(filePath: string): string {
  const ext = filePath.slice(filePath.lastIndexOf(".") + 1).toLowerCase();
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "tsx",
    js: "javascript",
    jsx: "jsx",
    json: "json",
    css: "css",
    html: "html",
    md: "markdown",
    sql: "sql",
    prisma: "prisma",
    yml: "yaml",
    yaml: "yaml",
    toml: "toml",
    env: "dotenv",
    sh: "bash",
  };
  return map[ext] ?? "text";
}

/**
 * 解析 LLM 输出的 <<<FILE: 路径>>> ... <<<END_FILE>>> 文件块序列
 *
 * 用于 ⑥ 前端开发 / ⑦ 后端开发 / ⑨ 测试修复 Agent。
 */
export function parseGeneratedFiles(text: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const re = /<<<FILE:\s*([^>\s]+)\s*>>>\s*([\s\S]*?)<<<END_FILE>>>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const path = (m[1] as string).trim();
    const content = (m[2] as string).replace(/\n$/, "");
    if (path) {
      files.push({ path, content, language: inferLanguage(path) });
    }
  }
  return files;
}

/**
 * Agent 运行异常
 *
 * 所有 Agent 在失败时包装为此异常并向上抛出，编排器据此记录日志。
 */
export class AgentError extends Error {
  constructor(
    public readonly agent: AgentRole,
    message: string,
    public override readonly cause?: unknown,
  ) {
    super(`[${agent}] ${message}`);
    this.name = "AgentError";
  }
}

/**
 * Agent 抽象基类
 *
 * 提供：
 *   - 模型解析（ctx.modelConfig → DEFAULT_MODEL_CONFIG[role] → createModel）
 *   - 统一日志（onLog）、进度回调（onProgress）、流式回调（onStream）
 *   - JSON 解析容错（剥离 markdown 代码块）
 *
 * 所有 10 个 Agent 都继承此类，run() 方法为核心入口。
 */
export abstract class BaseAgent<T = unknown> {
  protected readonly role: AgentRole;

  constructor(protected ctx: OrchestratorContext, role: AgentRole) {
    this.role = role;
  }

  /**
   * 解析当前 Agent 应使用的模型配置
   *
   * 优先使用会话级 modelConfig，缺省时回退到 DEFAULT_MODEL_CONFIG[role]。
   */
  protected resolveConfig(): AIModelConfig {
    const cfg: AIModelConfig | undefined =
      this.ctx.modelConfig ?? DEFAULT_MODEL_CONFIG[this.role];
    if (!cfg) {
      throw new AgentError(this.role, `未找到角色默认模型配置`);
    }
    if (!cfg.apiKey && !isLocalProvider(cfg.provider)) {
      throw new AgentError(
        this.role,
        `Provider ${cfg.provider}（${cfg.model}）缺少 apiKey，请在设置中配置后重试`,
      );
    }
    return cfg;
  }

  /**
   * 解析当前 Agent 应使用的 LanguageModel
   */
  protected resolveModel(): LanguageModel {
    return createModel(this.resolveConfig());
  }

  /**
   * 构造 LLM 调用通用参数（temperature / maxOutputTokens）
   *
   * 注意：AI SDK 5.0 将 maxTokens 重命名为 maxOutputTokens，
   * 此处从 AIModelConfig.maxTokens 映射过去。
   */
  protected llmOptions(): { temperature?: number; maxOutputTokens?: number } {
    const cfg = this.resolveConfig();
    const opts: { temperature?: number; maxOutputTokens?: number } = {};
    if (cfg.temperature != null) opts.temperature = cfg.temperature;
    if (cfg.maxTokens != null) opts.maxOutputTokens = cfg.maxTokens;
    return opts;
  }

  /** 记录一条 Agent 日志 */
  protected log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>,
  ): void {
    const entry: AgentLog = {
      id: createLogId(),
      sessionId: this.ctx.sessionId,
      agent: this.role,
      level,
      message,
      metadata,
      createdAt: new Date().toISOString(),
    };
    this.ctx.onLog(entry);
  }

  /** 推送一段流式输出 */
  protected stream(chunk: string): void {
    this.ctx.onStream(chunk);
  }

  /** 上报当前 Agent 的进度百分比（0~100） */
  protected progress(percent: number): void {
    this.ctx.onProgress(this.role, Math.max(0, Math.min(100, percent)));
  }

  /**
   * 容错解析 LLM 输出的 JSON
   *
   * 剥离 ```json 代码块包裹，并尝试截取首个 {...} 片段。
   */
  protected parseJSON<T>(text: string): T {
    const cleaned = text
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    const slice =
      start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
    try {
      return JSON.parse(slice) as T;
    } catch (err) {
      throw new AgentError(this.role, `LLM 输出 JSON 解析失败：${slice.slice(0, 200)}`, err);
    }
  }

  /**
   * Agent 执行入口
   */
  abstract run(): Promise<T>;
}
