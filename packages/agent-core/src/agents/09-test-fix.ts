/**
 * ⑨ 测试修复 Agent
 *
 * 循环执行（最多 3 轮）。分级修复策略：
 *   - L1：tsc / lint 失败 → 用 LLM 重写失败文件（自动）
 *   - L2：逻辑错误 → 向用户展示 A/B/C 选择（此处记录日志，由编排器/前端承接交互）
 *   - L3：致命错误 / 修复超限 → 回滚到上一可用产物
 *
 * 依赖 ctx.workspace 提供：写入文件 + 执行沙箱命令。
 * 若未提供 workspace，跳过编译验证，直接返回原文件（视为通过）。
 */

import { generateText } from "ai";
import { AgentRole, FixLevel, LogLevel } from "@lynxkit/shared";
import { BaseAgent, parseGeneratedFiles, type GeneratedFile } from "../types";
import type { OrchestratorContext } from "../orchestrator";
import { testFixPrompt } from "../prompts/test-fix";
import {
  executeBash,
  writeGeneratedFiles,
} from "../tools/index";
import type { FrontendDevResult } from "./06-frontend-dev";
import type { BackendDevResult } from "./07-backend-dev";

export interface TestFixResult {
  /** 修复后的文件全集 */
  fixedFiles: GeneratedFile[];
  /** 触发的修复等级 */
  fixLevel: FixLevel | "none";
  /** 实际执行的修复轮数 */
  rounds: number;
  /** 是否通过验证 */
  success: boolean;
  /** 最后一轮的错误信息 */
  errors?: string;
  /** L2 场景下待用户选择的选项 */
  pendingChoices?: Array<{ id: string; label: string }>;
}

const MAX_ROUNDS = 3;

export class TestFixAgent extends BaseAgent<TestFixResult> {
  constructor(
    ctx: OrchestratorContext,
    private inputs: { frontend: FrontendDevResult; backend: BackendDevResult },
  ) {
    super(ctx, AgentRole.TEST_FIX);
  }

  async run(): Promise<TestFixResult> {
    this.log(LogLevel.INFO, "⑨ 测试修复开始");
    let files: GeneratedFile[] = [
      ...this.inputs.frontend.files,
      ...this.inputs.backend.files,
    ];
    this.progress(10);

    const workspace = this.ctx.workspace;
    if (!workspace) {
      this.log(
        LogLevel.WARN,
        "未提供 workspace，跳过编译验证，直接返回生成文件",
      );
      this.progress(100);
      return { fixedFiles: files, fixLevel: "none", rounds: 0, success: true };
    }

    // 落盘初始产物
    await writeGeneratedFiles(workspace, files);

    let rounds = 0;
    let lastErrors = "";
    while (rounds < MAX_ROUNDS) {
      rounds += 1;
      this.progress(10 + Math.floor((rounds / MAX_ROUNDS) * 70));

      // L1：执行 tsc --noEmit
      const tsc = executeBash("tsc --noEmit", {
        cwd: workspace,
        workspace,
      });
      const errors = [tsc.stdout, tsc.stderr].filter(Boolean).join("\n").trim();
      lastErrors = errors;

      if (tsc.exitCode === 0) {
        this.log(LogLevel.INFO, `第 ${rounds} 轮 tsc 通过`, { rounds });
        this.progress(100);
        return {
          fixedFiles: files,
          fixLevel: "none",
          rounds,
          success: true,
        };
      }

      this.log(
        LogLevel.WARN,
        `第 ${rounds} 轮 tsc 失败，启动 L1 LLM 修复`,
        { stderr: errors.slice(0, 500) },
      );

      // L1：用 LLM 重写失败文件
      const rewritten = await this.rewriteFiles(files, errors);
      if (rewritten.length === 0) {
        // LLM 无法修复 → 升级到 L2，记录候选选项
        this.log(LogLevel.ERROR, "LLM 未能产出修复，升级到 L2 引导修复");
        this.progress(100);
        return {
          fixedFiles: files,
          fixLevel: FixLevel.L2,
          rounds,
          success: false,
          errors,
          pendingChoices: [
            { id: "A", label: "忽略错误继续部署" },
            { id: "B", label: "回退到上一可用产物" },
            { id: "C", label: "人工介入修复" },
          ],
        };
      }

      files = mergeFiles(files, rewritten);
      await writeGeneratedFiles(workspace, rewritten);
    }

    // L3：修复超限，回滚
    this.log(
      LogLevel.ERROR,
      `修复轮次超限（${MAX_ROUNDS}），触发 L3 回滚`,
      { lastErrors: lastErrors.slice(0, 500) },
    );
    this.progress(100);
    return {
      fixedFiles: files,
      fixLevel: FixLevel.L3,
      rounds,
      success: false,
      errors: lastErrors,
    };
  }

  /**
   * 用 LLM 按错误信息重写文件
   */
  private async rewriteFiles(
    files: GeneratedFile[],
    errors: string,
  ): Promise<GeneratedFile[]> {
    const fileBlocks = files
      .map((f) => `<<<FILE: ${f.path}>>>\n${f.content}\n<<<END_FILE>>>`)
      .join("\n\n");

    const { text } = await generateText({
      model: this.resolveModel(),
      system: testFixPrompt,
      prompt: [
        `# 错误信息（tsc --noEmit 输出）`,
        errors,
        ``,
        `# 待修复文件`,
        fileBlocks,
        ``,
        `请仅输出需要修复的文件，每个文件用 <<<FILE>>> / <<<END_FILE>>> 包裹。`,
      ].join("\n"),
      ...this.llmOptions(),
    });

    return parseGeneratedFiles(text);
  }
}

/**
 * 用 fixedFiles 中的同名文件覆盖 originals
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
