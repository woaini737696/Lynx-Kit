/**
 * ② 架构师 Agent
 *
 * 串行执行。基于产品类型 + 用户需求，输出技术栈与目录结构（Architecture）。
 * LLM 输出缺失的字段会回退到产品类型元数据的推荐技术栈。
 */

import { generateText } from "ai";
import {
  AgentRole,
  LogLevel,
  type Architecture,
  getProductTypeMeta,
} from "@lynxkit/shared";
import { BaseAgent } from "../types.js";
import type { OrchestratorContext } from "../orchestrator.js";
import { architectPrompt } from "../prompts/architect.js";
import type { IntentResult } from "./01-intent.js";

export interface ArchitectResult extends Architecture {
  /** 前后端目录结构建议 */
  dirStructure?: Record<string, string[]>;
  /** 选型理由 */
  rationale?: string;
}

export class ArchitectAgent extends BaseAgent<ArchitectResult> {
  constructor(
    ctx: OrchestratorContext,
    private intent: IntentResult,
  ) {
    super(ctx, AgentRole.ARCHITECT);
  }

  async run(): Promise<ArchitectResult> {
    this.log(LogLevel.INFO, "② 架构设计开始");
    this.progress(10);

    const meta = getProductTypeMeta(this.intent.productType);
    const fallback: ArchitectResult = {
      frontend: meta?.techStack.slice(0, 4) ?? ["Next.js"],
      backend: ["Hono", "Drizzle ORM", "JWT"],
      database: ["PostgreSQL"],
      ai: ["Vercel AI SDK 5.0"],
      deploy: ["Vercel", "Docker Compose"],
    };

    let result: ArchitectResult = fallback;
    try {
      const { text } = await generateText({
        model: this.resolveModel(),
        system: architectPrompt,
        prompt: `产品类型：${this.intent.productType}\n核心功能：${this.intent.coreFeatures.join("、")}\n需求摘要：${this.intent.summary}\n用户原始需求：${this.ctx.inspiration}\n\n请返回 Architecture JSON。`,
        ...this.llmOptions(),
      });
      const parsed = this.parseJSON<ArchitectResult>(text);
      // 合并：LLM 缺失字段用 fallback 补齐
      result = {
        frontend: parsed.frontend?.length ? parsed.frontend : fallback.frontend,
        backend: parsed.backend?.length ? parsed.backend : fallback.backend,
        database: parsed.database?.length ? parsed.database : fallback.database,
        ai: parsed.ai?.length ? parsed.ai : fallback.ai,
        deploy: parsed.deploy?.length ? parsed.deploy : fallback.deploy,
        dirStructure: parsed.dirStructure,
        rationale: parsed.rationale,
      };
      this.progress(80);
    } catch (err) {
      this.log(
        LogLevel.WARN,
        "LLM 架构设计失败，回退到产品类型默认技术栈",
        { error: err instanceof Error ? err.message : String(err) },
      );
    }

    this.log(LogLevel.INFO, "② 架构设计完成", {
      stacks: [result.frontend, result.backend, result.database]
        .flat()
        .join(", "),
    });
    this.progress(100);
    return result;
  }
}
