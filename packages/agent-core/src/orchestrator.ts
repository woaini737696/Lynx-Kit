import type { LLMProvider } from "./providers/types.js";

import { recognizeIntent, type IntentOutput } from "./agents/intent.js";
import {
  clarifyNext,
  buildConfig,
  type ClarifyOutput,
} from "./agents/clarify.js";
import { selectTemplate, type SelectOutput } from "./agents/select.js";
import { fillTemplate, type FillOutput } from "./agents/fill.js";
import { buildProject, type BuildOutput } from "./agents/build.js";
import { fixProject, type FixOutput, type FixChoice } from "./agents/fix.js";
import { deployProject, type DeployOutput } from "./agents/deploy.js";

import type { ProjectType, Template } from "@lynxkit/shared";

/**
 * 七层 Agent 编排器
 *
 * 串联 ①~⑦ 七个 Agent，完成从"用户需求"到"线上部署"的完整链路。
 *
 * 设计要点：
 *   - 状态机驱动：每个 step 都有明确的输入/输出，便于断点续跑
 *   - 支持人工介入：在澄清环节（②）和引导修复环节（⑥-L2）暂停等待用户回答
 *   - 修复循环：⑤→⑥ 失败后回到 ⑤ 重试，直到成功或触发 L3 回滚
 *   - 全程可观测：每个 step 的输入/输出/耗时记录到 OrchestratorLog
 *
 * 与产品文档 §8.1 流程一致：
 *   用户输入需求
 *     ↓
 *   ① 意图识别 → ② 需求澄清 → ③ 模板选择 → ④ 配置填充
 *     ↓
 *   ⑤ 编译测试 ──失败──> ⑥ 修复 ──成功──> ⑤
 *     ↓ 成功
 *   ⑦ 部署
 */

export type OrchestratorStage =
  | "intent"
  | "clarify"
  | "select"
  | "fill"
  | "build"
  | "fix"
  | "deploy"
  | "done"
  | "failed";

export interface OrchestratorInput {
  /** 用户原始需求（自然语言） */
  userInput: string;
  /** 当前已有的回答（用于断点续跑） */
  answers?: Record<string, unknown>;
  /** L2 引导修复时用户的选择 */
  fixChoice?: FixChoice["id"];
  /** 指定产品类型（可选，覆盖 ① 识别结果） */
  forceProjectType?: ProjectType;
  /** 目标服务器 ID（部署阶段必填） */
  serverId?: string;
  /** 用户域名（部署阶段可选） */
  domain?: string;
  /** 最大修复重试次数（默认 5） */
  maxFixAttempts?: number;
}

export interface OrchestratorContext {
  /** ① 识别结果 */
  intent?: IntentOutput;
  /** 当前模板配置 */
  template?: Template;
  /** ② 澄清结果 */
  clarify?: ClarifyOutput;
  /** ③ 选择结果 */
  select?: SelectOutput;
  /** ④ 填充结果 */
  fill?: FillOutput;
  /** ⑤ 构建结果 */
  build?: BuildOutput;
  /** ⑥ 修复结果 */
  fix?: FixOutput;
  /** ⑦ 部署结果 */
  deploy?: DeployOutput;
  /** 当前重试次数 */
  fixAttempts: number;
  /** 阶段日志 */
  logs: OrchestratorLogEntry[];
}

export interface OrchestratorLogEntry {
  stage: OrchestratorStage;
  timestamp: string;
  durationMs: number;
  message: string;
  /** 是否成功 */
  success: boolean;
}

export interface OrchestratorResult {
  /** 当前阶段 */
  stage: OrchestratorStage;
  /** 上下文（用于断点续跑） */
  context: OrchestratorContext;
  /** 是否需要用户介入（澄清或 L2 引导） */
  needsUserInput: boolean;
  /** 用户介入时的问题（澄清阶段） */
  pendingQuestion?: ClarifyOutput["nextQuestion"];
  /** 用户介入时的选项（L2 修复阶段） */
  pendingChoices?: FixChoice[];
  /** 最终访问地址（部署成功后填充） */
  finalUrl?: string;
  /** 失败原因 */
  error?: string;
}

/**
 * 编排器
 *
 * 单次 run 方法推进到下一个暂停点或终点。
 * 前端调用流程：
 *   1. 调用 run({ userInput }) → 返回澄清问题或部署结果
 *   2. 用户回答后，调用 run({ userInput, answers, context }) 继续
 *   3. L2 修复时返回 pendingChoices，用户选择后调用 run({ userInput, fixChoice, context })
 *
 * @param input 用户输入 + 上下文
 * @param template 模板配置（由 tRPC 层根据 ① 的产品类型加载）
 * @param llm 可选的 LLM Provider
 * @param previousContext 上一次返回的 context（断点续跑）
 */
export async function runOrchestrator(
  input: OrchestratorInput,
  template: Template | undefined,
  llm?: LLMProvider,
  previousContext?: OrchestratorContext
): Promise<OrchestratorResult> {
  const ctx: OrchestratorContext = previousContext ?? {
    fixAttempts: 0,
    logs: [],
  };
  const maxAttempts = input.maxFixAttempts ?? 5;

  // ① 意图识别（仅首次执行）
  if (!ctx.intent) {
    const result = await timedStep("intent", ctx, () =>
      input.forceProjectType
        ? Promise.resolve({
            type: input.forceProjectType!,
            confidence: 1,
            ruleMatched: false,
          })
        : recognizeIntent({ userInput: input.userInput }, llm)
    );
    ctx.intent = result;
  }

  // ② 需求澄清（按问题逐步推进）
  if (!ctx.clarify?.completed) {
    if (!template) {
      return fail(ctx, "未提供模板配置，无法继续澄清");
    }
    ctx.template = template;
    const result = await timedStep("clarify", ctx, () =>
      clarifyNext({
        projectType: ctx.intent!.type,
        template,
        answers: input.answers ?? {},
      })
    );
    ctx.clarify = result;

    if (!result.completed) {
      return {
        stage: "clarify",
        context: ctx,
        needsUserInput: true,
        pendingQuestion: result.nextQuestion,
      };
    }
  }

  // ③ 模板选择
  if (!ctx.select) {
    const result = await timedStep("select", ctx, () =>
      selectTemplate({ projectType: ctx.intent!.type })
    );
    ctx.select = result;
  }

  // ④ 配置填充
  if (!ctx.fill) {
    const config = buildConfig(ctx.template!, input.answers ?? {});
    const result = await timedStep("fill", ctx, () =>
      fillTemplate(
        {
          templatePath: ctx.select!.basePath,
          templateVersion: ctx.select!.version,
          config,
          projectName: input.userInput.slice(0, 50),
        },
        llm
      )
    );
    ctx.fill = result;
  }

  // ⑤⑥ 构建 + 修复循环
  if (!ctx.build?.success) {
    // 处理 L2 引导修复的用户回答
    if (input.fixChoice && ctx.fix?.strategy === "L2_guided") {
      // TODO: Week 3 根据 fixChoice 重新生成代码
    }

    const buildResult = await timedStep("build", ctx, () =>
      buildProject({
        projectId: input.userInput,
        files: ctx.fill!.files,
        projectType: ctx.intent!.type,
      })
    );
    ctx.build = buildResult;

    if (!buildResult.success) {
      // ⑥ 修复
      ctx.fixAttempts += 1;
      if (ctx.fixAttempts > maxAttempts) {
        return fail(ctx, `修复次数超限（${maxAttempts}次），请重新描述需求`);
      }
      const fixResult = await timedStep("fix", ctx, () =>
        fixProject({
          projectId: input.userInput,
          files: ctx.fill!.files,
          errors: buildResult.errors,
          attempt: ctx.fixAttempts,
        })
      );
      ctx.fix = fixResult;

      if (fixResult.needsUserInput) {
        return {
          stage: "fix",
          context: ctx,
          needsUserInput: true,
          pendingChoices: fixResult.userChoices,
        };
      }

      // L1 静默修复或 L3 回滚后，重试构建
      if (fixResult.fixedFiles.length > 0) {
        ctx.fill = { ...ctx.fill!, files: fixResult.fixedFiles };
      }
      // 递归进入下一轮构建
      return runOrchestrator(input, template, llm, ctx);
    }
  }

  // ⑦ 部署
  if (!ctx.deploy || ctx.deploy.status !== "success") {
    if (!input.serverId) {
      return fail(ctx, "未指定目标服务器，无法部署");
    }
    const result = await timedStep("deploy", ctx, () =>
      deployProject({
        projectId: input.userInput,
        files: ctx.fill!.files,
        serverId: input.serverId,
        domain: input.domain,
      })
    );
    ctx.deploy = result;

    if (result.status !== "success") {
      return fail(ctx, result.error ?? "部署失败");
    }
  }

  return {
    stage: "done",
    context: ctx,
    needsUserInput: false,
    finalUrl: ctx.deploy?.url,
  };
}

/**
 * 计时执行某个阶段，并写入日志
 */
async function timedStep<T>(
  stage: OrchestratorStage,
  ctx: OrchestratorContext,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    ctx.logs.push({
      stage,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - start,
      message: `${stage} 阶段完成`,
      success: true,
    });
    return result;
  } catch (err) {
    ctx.logs.push({
      stage,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - start,
      message: err instanceof Error ? err.message : String(err),
      success: false,
    });
    throw err;
  }
}

/**
 * 构造失败结果
 */
function fail(ctx: OrchestratorContext, message: string): OrchestratorResult {
  return {
    stage: "failed",
    context: ctx,
    needsUserInput: false,
    error: message,
  };
}
