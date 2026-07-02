/**
 * ① 意图识别 Agent
 *
 * 串行执行。先用规则引擎快速匹配产品类型，再用 LLM 补充核心功能与摘要，
 * 合并两者得到最终 IntentResult。
 */

import { generateText } from "ai";
import {
  AgentRole,
  LogLevel,
  ProductType,
  matchProductType,
} from "@lynxkit/shared";
import { BaseAgent } from "../types.js";
import type { OrchestratorContext } from "../orchestrator.js";
import { intentPrompt } from "../prompts/intent.js";

export interface IntentResult {
  /** 识别出的产品类型 */
  productType: ProductType;
  /** 置信度 0~1 */
  confidence: number;
  /** 核心功能点 */
  coreFeatures: string[];
  /** 一句话摘要 */
  summary: string;
}

interface LLMIntentOutput {
  productType?: string;
  confidence?: number | string;
  coreFeatures?: string[];
  summary?: string;
}

const VALID_PRODUCT_TYPES: ReadonlySet<string> = new Set(
  Object.values(ProductType),
);

export class IntentAgent extends BaseAgent<IntentResult> {
  constructor(ctx: OrchestratorContext) {
    super(ctx, AgentRole.INTENT);
  }

  async run(): Promise<IntentResult> {
    this.log(LogLevel.INFO, "① 意图识别开始");
    this.progress(10);

    const ruleMatch = matchProductType(this.ctx.inspiration);

    let llm: LLMIntentOutput = {};
    try {
      const { text } = await generateText({
        model: this.resolveModel(),
        system: intentPrompt,
        prompt: `用户需求：${this.ctx.inspiration}\n\n请分析并返回 JSON：{productType, confidence, coreFeatures[], summary}`,
        ...this.llmOptions(),
      });
      llm = this.parseJSON<LLMIntentOutput>(text);
      this.progress(80);
    } catch (err) {
      this.log(
        LogLevel.WARN,
        "LLM 意图识别失败，回退到规则匹配结果",
        { error: err instanceof Error ? err.message : String(err) },
      );
    }

    // 合并规则与 LLM 结果：取置信度较高者作为 productType
    const llmConfidence =
      typeof llm.confidence === "number"
        ? llm.confidence
        : llm.confidence != null
          ? Number(llm.confidence)
          : 0;
    const llmTypeValid =
      llm.productType != null && VALID_PRODUCT_TYPES.has(llm.productType);

    let productType: ProductType;
    let confidence: number;
    if (ruleMatch && ruleMatch.confidence >= llmConfidence) {
      productType = ruleMatch.type;
      confidence = ruleMatch.confidence;
    } else if (llmTypeValid) {
      productType = llm.productType as ProductType;
      confidence = llmConfidence;
    } else if (ruleMatch) {
      productType = ruleMatch.type;
      confidence = ruleMatch.confidence;
    } else {
      // 兜底
      productType = ProductType.SYSTEM;
      confidence = 0.3;
    }

    const result: IntentResult = {
      productType,
      confidence: Number(confidence.toFixed(2)),
      coreFeatures:
        llm.coreFeatures && llm.coreFeatures.length > 0
          ? llm.coreFeatures.slice(0, 6)
          : ["（待 PM 细化）"],
      summary: llm.summary ?? this.ctx.inspiration.slice(0, 40),
    };

    this.log(LogLevel.INFO, "① 意图识别完成", { ...result });
    this.progress(100);
    return result;
  }
}
