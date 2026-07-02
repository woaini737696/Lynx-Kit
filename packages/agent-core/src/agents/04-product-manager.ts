/**
 * ④ 产品经理 Agent
 *
 * 与 ⑤ 设计师并行执行。用 LLM 生成：
 *   - 功能模块列表（含优先级）
 *   - 数据模型草稿（Drizzle schema 字段）
 *   - API 设计
 *   - 验收标准
 */

import { generateText } from "ai";
import { AgentRole, LogLevel } from "@lynxkit/shared";
import { BaseAgent } from "../types.js";
import type { OrchestratorContext } from "../orchestrator.js";
import { pmPrompt } from "../prompts/pm.js";
import type { DataModel } from "../tools/schema-generator.js";
import type { IntentResult } from "./01-intent.js";
import type { ArchitectResult } from "./02-architect.js";
import type { ClarifyResult } from "./03-clarify.js";

export interface PMModule {
  name: string;
  priority: "P0" | "P1" | "P2";
  features: string[];
}

export interface PMApi {
  method: string;
  path: string;
  summary: string;
  request: Record<string, unknown>;
  response: Record<string, unknown>;
}

export interface PMResult {
  modules: PMModule[];
  dataModels: DataModel[];
  apis: PMApi[];
  acceptanceCriteria: string[];
}

export class ProductManagerAgent extends BaseAgent<PMResult> {
  constructor(
    ctx: OrchestratorContext,
    private intent: IntentResult,
    private architecture: ArchitectResult,
    private clarification?: ClarifyResult,
  ) {
    super(ctx, AgentRole.PRODUCT_MANAGER);
  }

  async run(): Promise<PMResult> {
    this.log(LogLevel.INFO, "④ 产品经理开始拆解 PRD");
    this.progress(10);

    const answers = this.clarification?.answers ?? this.ctx.answers ?? {};
    const { text } = await generateText({
      model: this.resolveModel(),
      system: pmPrompt,
      prompt: [
        `产品类型：${this.intent.productType}`,
        `需求摘要：${this.intent.summary}`,
        `核心功能：${this.intent.coreFeatures.join("、")}`,
        `技术栈：${[...this.architecture.frontend, ...this.architecture.backend].join("、")}`,
        `澄清配置：${JSON.stringify(answers)}`,
        `用户原始需求：${this.ctx.inspiration}`,
        ``,
        `请返回 PRD JSON（modules / dataModels / apis / acceptanceCriteria）。`,
      ].join("\n"),
      ...this.llmOptions(),
    });

    const parsed = this.parseJSON<PMResult>(text);

    const result: PMResult = {
      modules: parsed.modules ?? [],
      dataModels: parsed.dataModels ?? [],
      apis: parsed.apis ?? [],
      acceptanceCriteria: parsed.acceptanceCriteria ?? [],
    };

    this.log(LogLevel.INFO, "④ 产品经理完成", {
      modules: result.modules.length,
      dataModels: result.dataModels.length,
      apis: result.apis.length,
    });
    this.progress(100);
    return result;
  }
}
