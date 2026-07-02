/**
 * ⑦ 后端开发 Agent
 *
 * 串行执行。用 streamText 流式生成 Hono API + Drizzle schema，
 * 边流式输出边累积，结束后解析 <<<FILE>>> 块得到文件清单。
 */

import { streamText } from "ai";
import { AgentRole, LogLevel } from "@lynxkit/shared";
import { BaseAgent, parseGeneratedFiles, type GeneratedFile } from "../types";
import type { OrchestratorContext } from "../orchestrator";
import { backendPrompt } from "../prompts/backend";
import type { PMResult } from "./04-product-manager";
import type { ArchitectResult } from "./02-architect";
import { generateDrizzleSchema } from "../tools/schema-generator";

export interface BackendDevResult {
  files: GeneratedFile[];
}

export class BackendDevAgent extends BaseAgent<BackendDevResult> {
  constructor(
    ctx: OrchestratorContext,
    private pm: PMResult,
    private architecture: ArchitectResult,
  ) {
    super(ctx, AgentRole.BACKEND_DEV);
  }

  async run(): Promise<BackendDevResult> {
    this.log(LogLevel.INFO, "⑦ 后端开发开始（流式生成）");
    this.progress(5);

    // 先用 schema-generator 把 PM 的 dataModels 转成 Drizzle schema（确定性产物）
    const deterministicSchema =
      this.pm.dataModels.length > 0
        ? generateDrizzleSchema(this.pm.dataModels)
        : "";

    const prompt = [
      `# 技术栈`,
      this.architecture.backend.join("、"),
      ``,
      `# 数据模型`,
      JSON.stringify(this.pm.dataModels, null, 2),
      ``,
      `# 确定性生成的 Drizzle schema（src/db/schema.ts，可直接复用，勿重复生成）`,
      "```typescript",
      deterministicSchema,
      "```",
      ``,
      `# API 设计`,
      this.pm.apis
        .map(
          (a) =>
            `- ${a.method} ${a.path} — ${a.summary}\n  请求：${JSON.stringify(a.request)}\n  响应：${JSON.stringify(a.response)}`,
        )
        .join("\n"),
      ``,
      `# 功能模块`,
      this.pm.modules
        .map((m) => `- [${m.priority}] ${m.name}：${m.features.join("、")}`)
        .join("\n"),
      ``,
      `请生成完整的后端代码（Hono 路由 + 中间件 + 鉴权），使用 <<<FILE>>> / <<<END_FILE>>> 块输出每个文件。schema.ts 已确定性生成，无需重复。`,
    ].join("\n");

    const result = streamText({
      model: this.resolveModel(),
      system: backendPrompt,
      prompt,
      ...this.llmOptions(),
    });

    let full = "";
    let lastProgress = 5;
    for await (const delta of result.textStream) {
      full += delta;
      this.stream(delta);
      const p = Math.min(90, 5 + Math.floor(full.length / 200));
      if (p > lastProgress) {
        lastProgress = p;
        this.progress(p);
      }
    }

    const files = parseGeneratedFiles(full);

    // 若 LLM 未生成 schema.ts，则补上确定性生成的版本
    const hasSchema = files.some((f) => f.path.endsWith("schema.ts"));
    if (!hasSchema && deterministicSchema) {
      files.push({
        path: "src/db/schema.ts",
        content: deterministicSchema,
        language: "typescript",
      });
    }

    this.log(LogLevel.INFO, "⑦ 后端开发完成", { fileCount: files.length });
    this.progress(100);
    return { files };
  }
}
