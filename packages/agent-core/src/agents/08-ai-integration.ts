/**
 * ⑧ AI 集成 Agent
 *
 * 串行执行。配置化生成：
 *   - LLM 调用代码（Vercel AI SDK 5.0，支持国内 6 大 Provider）
 *   - RAG 配置（如产品需要知识库 / 文档问答）
 *   - Tool calling 配置
 *   - Prompt 模板管理
 */

import { generateText } from "ai";
import { AgentRole, LogLevel } from "@lynxkit/shared";
import { BaseAgent, parseGeneratedFiles, type GeneratedFile } from "../types";
import type { OrchestratorContext } from "../orchestrator";
import { aiIntegrationPrompt } from "../prompts/ai-integration";
import type { PMResult } from "./04-product-manager";

export interface AIIntegrationResult {
  files: GeneratedFile[];
}

export class AIIntegrationAgent extends BaseAgent<AIIntegrationResult> {
  constructor(
    ctx: OrchestratorContext,
    private pm: PMResult,
  ) {
    super(ctx, AgentRole.AI_INTEGRATION);
  }

  async run(): Promise<AIIntegrationResult> {
    this.log(LogLevel.INFO, "⑧ AI 集成开始");
    this.progress(10);

    const aiAbility = this.ctx.answers?.q_ai_ability;
    const needRag =
      aiAbility === "文档 RAG" ||
      this.pm.modules.some((m) =>
        m.features.some((f) => f.includes("知识库") || f.includes("RAG") || f.includes("文档")),
      );

    const prompt = [
      `# 产品的 AI 能力需求`,
      `用户偏好：${aiAbility ?? "对话问答"}`,
      `是否需要 RAG：${needRag ? "是" : "否"}`,
      ``,
      `# 功能模块`,
      this.pm.modules
        .map((m) => `- ${m.name}：${m.features.join("、")}`)
        .join("\n"),
      ``,
      `请生成 AI 集成代码（provider / chat${needRag ? " / rag" : ""} / tools / prompts），使用 <<<FILE>>> / <<<END_FILE>>> 块输出。`,
    ].join("\n");

    const { text } = await generateText({
      model: this.resolveModel(),
      system: aiIntegrationPrompt,
      prompt,
      ...this.llmOptions(),
    });

    const files = parseGeneratedFiles(text);
    this.log(LogLevel.INFO, "⑧ AI 集成完成", {
      fileCount: files.length,
      rag: needRag,
    });
    this.progress(100);
    return { files };
  }
}
