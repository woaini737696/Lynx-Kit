import type { LLMProvider } from "../providers/types.js";
import type { BuildError } from "./build.js";
import type { GeneratedFile } from "./fill.js";

/**
 * ⑥ 修复 Agent（Claude Sonnet 4.6）
 *
 * 输入：错误日志 + 相关代码文件
 * 输出：修复后的代码
 *
 * 三级修复策略（与产品文档 §8.2 对应）：
 *   L1 静默修复：编译错误、依赖缺失、类型错误等，AI 自动分析重写，最多 3 次
 *   L2 引导修复：逻辑错误、AI 无法确定用户意图，问用户选择题（A/B/C），最多 2 次
 *   L3 安全回滚：致命错误、多次修复失败，自动 git reset 到上一可用版本，1 次
 */

export interface FixInput {
  /** 项目 ID */
  projectId: string;
  /** 当前代码包 */
  files: GeneratedFile[];
  /** 构建错误列表 */
  errors: BuildError[];
  /** 当前重试次数（用于判断是否升级策略） */
  attempt: number;
  /** 上一可用版本的代码包（用于 L3 回滚） */
  previousVersion?: GeneratedFile[];
}

export type FixStrategy = "L1_silent" | "L2_guided" | "L3_rollback";

export interface FixOutput {
  /** 修复策略 */
  strategy: FixStrategy;
  /** 修复后的代码包 */
  fixedFiles: GeneratedFile[];
  /** 是否需要用户介入 */
  needsUserInput: boolean;
  /** L2 引导修复时的选择题（用户可选 A/B/C） */
  userChoices?: FixChoice[];
  /** 修复说明 */
  message: string;
}

export interface FixChoice {
  /** 选项标识 */
  id: string;
  /** 选项描述 */
  label: string;
  /** 选项详情 */
  description?: string;
}

/**
 * 修复 Agent
 *
 * 根据重试次数自动选择修复策略：
 *   attempt 0-2: L1 静默修复（AI 自动重写）
 *   attempt 3-4: L2 引导修复（问用户选择题）
 *   attempt 5+ 或致命错误: L3 安全回滚
 *
 * TODO: Week 3 完整实现
 */
export async function fixProject(
  input: FixInput,
  llm?: LLMProvider
): Promise<FixOutput> {
  const strategy = decideStrategy(input);

  switch (strategy) {
    case "L1_silent":
      return await l1SilentFix(input, llm);

    case "L2_guided":
      return await l2GuidedFix(input, llm);

    case "L3_rollback":
      return await l3Rollback(input);
  }
}

/**
 * 根据重试次数和错误类型决定修复策略
 */
function decideStrategy(input: FixInput): FixStrategy {
  // 致命错误或重试次数超限，直接回滚
  const hasFatalError = input.errors.some(
    (e) => e.type === "runtime_error" || e.type === "unknown"
  );
  if (hasFatalError || input.attempt >= 5) {
    return "L3_rollback";
  }

  // L1 范围：编译/类型/语法/依赖错误，前 3 次
  if (input.attempt < 3) {
    return "L1_silent";
  }

  // L2 范围：逻辑错误，3-4 次
  return "L2_guided";
}

/**
 * L1 静默修复：AI 自动分析错误日志，重写修复
 */
async function l1SilentFix(
  input: FixInput,
  llm?: LLMProvider
): Promise<FixOutput> {
  // TODO: Week 3 完整实现
  // 1. 将错误日志 + 相关文件传给 Claude Sonnet
  // 2. LLM 返回修复后的代码
  // 3. 返回 FixOutput
  void input;
  void llm;

  return {
    strategy: "L1_silent",
    fixedFiles: [],
    needsUserInput: false,
    message: "[Week 1 占位] L1 静默修复未实际执行",
  };
}

/**
 * L2 引导修复：问用户选择题
 */
async function l2GuidedFix(
  input: FixInput,
  llm?: LLMProvider
): Promise<FixOutput> {
  // TODO: Week 3 完整实现
  // 1. 将错误传给 Claude，要求生成 A/B/C 选择题
  // 2. 返回选择题给前端
  // 3. 用户选择后，根据选择重新生成代码
  void input;
  void llm;

  return {
    strategy: "L2_guided",
    fixedFiles: [],
    needsUserInput: true,
    userChoices: [
      {
        id: "A",
        label: "保持当前实现",
        description: "不做修改，继续构建",
      },
      {
        id: "B",
        label: "简化方案",
        description: "移除复杂逻辑，使用简化实现",
      },
      {
        id: "C",
        label: "重新生成",
        description: "完全重新生成受影响的代码",
      },
    ],
    message: "[Week 1 占位] L2 引导修复未实际执行，已返回默认选择题",
  };
}

/**
 * L3 安全回滚：恢复到上一可用版本
 */
async function l3Rollback(input: FixInput): Promise<FixOutput> {
  if (!input.previousVersion || input.previousVersion.length === 0) {
    return {
      strategy: "L3_rollback",
      fixedFiles: [],
      needsUserInput: false,
      message: "无可回滚的版本，请重新描述需求",
    };
  }

  return {
    strategy: "L3_rollback",
    fixedFiles: input.previousVersion,
    needsUserInput: false,
    message: "已自动恢复至上一可用版本",
  };
}
