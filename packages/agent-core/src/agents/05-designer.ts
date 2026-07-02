/**
 * ⑤ 设计师 Agent
 *
 * 与 ④ 产品经理并行执行。用 LLM 产出设计系统：
 *   - 色板 / 字体 / 圆角 / 间距
 *   - 页面骨架
 *   - shadcn 组件清单
 */

import { generateText } from "ai";
import { AgentRole, LogLevel } from "@lynxkit/shared";
import { BaseAgent } from "../types";
import type { OrchestratorContext } from "../orchestrator";
import { designerPrompt } from "../prompts/designer";
import type { IntentResult } from "./01-intent";

export interface DesignerResult {
  designSystem: {
    colors: Record<string, string>;
    font: Record<string, string>;
    radius: string;
    spacing: string;
  };
  pages: Array<{ name: string; route: string; blocks: string[] }>;
  components: Array<{ page: string; shadcn: string[] }>;
  theme: string;
}

export class DesignerAgent extends BaseAgent<DesignerResult> {
  constructor(
    ctx: OrchestratorContext,
    private intent: IntentResult,
  ) {
    super(ctx, AgentRole.DESIGNER);
  }

  async run(): Promise<DesignerResult> {
    this.log(LogLevel.INFO, "⑤ 设计师开始产出设计系统");
    this.progress(10);

    const { text } = await generateText({
      model: this.resolveModel(),
      system: designerPrompt,
      prompt: [
        `产品类型：${this.intent.productType}`,
        `核心功能：${this.intent.coreFeatures.join("、")}`,
        `需求摘要：${this.intent.summary}`,
        `用户原始需求：${this.ctx.inspiration}`,
        ``,
        `请返回设计系统 JSON（designSystem / pages / components / theme）。`,
      ].join("\n"),
      ...this.llmOptions(),
    });

    const parsed = this.parseJSON<DesignerResult>(text);

    const result: DesignerResult = {
      designSystem: parsed.designSystem ?? {
        colors: { primary: "#3B82F6" },
        font: { sans: "Inter, system-ui, sans-serif" },
        radius: "0.5rem",
        spacing: "Tailwind 4px 基准",
      },
      pages: parsed.pages ?? [],
      components: parsed.components ?? [],
      theme: parsed.theme ?? "亮色优先",
    };

    this.log(LogLevel.INFO, "⑤ 设计师完成", {
      pages: result.pages.length,
      componentGroups: result.components.length,
    });
    this.progress(100);
    return result;
  }
}
