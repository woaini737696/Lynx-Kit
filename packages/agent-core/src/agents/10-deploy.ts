/**
 * ⑩ 部署发布 Agent
 *
 * 串行执行。生成部署清单（构建命令 / 环境变量 / 托管目标），
 * 并通过注入的 DeployerAdapter 把产物发布到 Vercel / 自托管服务器 / 桌面端。
 *
 * 若 ctx 未注入 deployer，返回本地预览 URL 并记录警告。
 */

import { generateText } from "ai";
import { AgentRole, LogLevel } from "@lynxkit/shared";
import { BaseAgent, type GeneratedFile } from "../types.js";
import type { OrchestratorContext } from "../orchestrator.js";
import { deployPrompt } from "../prompts/deploy.js";

export interface DeployManifest {
  buildCommand: string;
  outputDir: string;
  hosting: "vercel" | "docker" | "self-hosted";
  envVars: Record<string, string>;
  healthCheck: string;
  startCommand: string;
}

export interface DeployResult {
  url: string;
  manifest: DeployManifest;
}

export class DeployAgent extends BaseAgent<DeployResult> {
  constructor(
    ctx: OrchestratorContext,
    private files: GeneratedFile[],
  ) {
    super(ctx, AgentRole.DEPLOY);
  }

  async run(): Promise<DeployResult> {
    this.log(LogLevel.INFO, "⑩ 部署发布开始");
    this.progress(20);

    // 用 LLM 生成部署清单
    const { text } = await generateText({
      model: this.resolveModel(),
      system: deployPrompt,
      prompt: [
        `# 文件清单（${this.files.length} 个）`,
        this.files.map((f) => `- ${f.path}`).join("\n"),
        ``,
        `# 部署偏好`,
        String(this.ctx.answers?.q_deploy_target ?? "Vercel"),
        ``,
        `请返回部署清单 JSON（buildCommand / outputDir / hosting / envVars / healthCheck / startCommand）。`,
      ].join("\n"),
      ...this.llmOptions(),
    });

    const manifest = this.parseJSON<DeployManifest>(text);
    this.progress(60);

    // 调用部署适配器（若注入）
    const deployer = this.ctx.deployer;
    const workspace = this.ctx.workspace;
    let url: string;
    if (deployer && workspace) {
      const res = await deployer.deploy({
        sessionId: this.ctx.sessionId,
        files: this.files,
        workspace,
      });
      url = res.url;
      this.log(LogLevel.INFO, "部署适配器执行完成", { url });
    } else {
      url = `http://localhost:3000/preview/${this.ctx.sessionId}`;
      this.log(
        LogLevel.WARN,
        "未注入 deployer 适配器，返回本地预览 URL",
        { url },
      );
    }

    this.progress(100);
    this.log(LogLevel.INFO, "⑩ 部署发布完成", { url, hosting: manifest.hosting });
    return { url, manifest };
  }
}
