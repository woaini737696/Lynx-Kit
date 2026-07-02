/**
 * ⑥ 前端开发 Agent
 *
 * 串行执行。用 streamText 流式生成 Next.js 代码（基于模板），
 * 边流式输出边累积，结束后解析 <<<FILE>>> 块得到文件清单。
 */

import { streamText } from "ai";
import { AgentRole, LogLevel } from "@lynxkit/shared";
import { BaseAgent, parseGeneratedFiles, type GeneratedFile } from "../types";
import type { OrchestratorContext } from "../orchestrator";
import { frontendPrompt } from "../prompts/frontend";
import type { PMResult } from "./04-product-manager";
import type { DesignerResult } from "./05-designer";
import type { ArchitectResult } from "./02-architect";

export interface FrontendDevResult {
  files: GeneratedFile[];
}

export class FrontendDevAgent extends BaseAgent<FrontendDevResult> {
  constructor(
    ctx: OrchestratorContext,
    private pm: PMResult,
    private designer: DesignerResult,
    private architecture: ArchitectResult,
  ) {
    super(ctx, AgentRole.FRONTEND_DEV);
  }

  async run(): Promise<FrontendDevResult> {
    this.log(LogLevel.INFO, "⑥ 前端开发开始（流式生成）");
    this.progress(5);

    const prompt = [
      `# 技术栈`,
      this.architecture.frontend.join("、"),
      ``,
      `# 设计系统`,
      JSON.stringify(this.designer.designSystem, null, 2),
      ``,
      `# 页面骨架`,
      this.designer.pages
        .map((p) => `- ${p.name}（${p.route}）：${p.blocks.join(" > ")}`)
        .join("\n"),
      ``,
      `# shadcn 组件清单`,
      JSON.stringify(
        this.designer.components.map((c) => c.shadcn).flat(),
        null,
        2,
      ),
      ``,
      `# 功能模块`,
      this.pm.modules
        .map((m) => `- [${m.priority}] ${m.name}：${m.features.join("、")}`)
        .join("\n"),
      ``,
      `# API 列表（前端调用）`,
      this.pm.apis.map((a) => `- ${a.method} ${a.path} — ${a.summary}`).join("\n"),
      ``,
      `请生成完整的前端代码，使用 <<<FILE>>> / <<<END_FILE>>> 块输出每个文件。`,
    ].join("\n");

    const result = streamText({
      model: this.resolveModel(),
      system: frontendPrompt,
      prompt,
      ...this.llmOptions(),
    });

    let full = "";
    let lastProgress = 5;
    for await (const delta of result.textStream) {
      full += delta;
      this.stream(delta);
      // 流式进度：按累积长度粗略推进，上限 90
      const p = Math.min(90, 5 + Math.floor(full.length / 200));
      if (p > lastProgress) {
        lastProgress = p;
        this.progress(p);
      }
    }

    const files = parseGeneratedFiles(full);
    this.log(LogLevel.INFO, "⑥ 前端开发完成", { fileCount: files.length });
    this.progress(100);
    return { files };
  }
}
