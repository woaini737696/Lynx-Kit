import type { ProjectType } from "@lynxkit/shared";
import type { Template, TemplateQuestion } from "@lynxkit/shared";

/**
 * ② 需求澄清 Agent（自研规则引擎，零 LLM 成本）
 *
 * 输入：产品类型 + 模板问题配置
 * 输出：动态问题流（前端按问题列表渲染表单）
 *
 * 实现：
 *   - 不调用 LLM，纯规则引擎
 *   - 根据 template.json 的 questions 配置生成问题流
 *   - 支持动态联动：选择"瑜伽"后，后续问题自动适配瑜伽场景
 *   - 实时预览：每回答一个问题，前端预览实时更新
 */

export interface ClarifyInput {
  /** 产品类型 */
  projectType: ProjectType;
  /** 模板配置（含 questions 数组） */
  template: Template;
  /** 当前已回答的问题（用于动态联动） */
  answers: Record<string, unknown>;
}

export interface ClarifyOutput {
  /** 下一个应该问的问题（null 表示问题已问完） */
  nextQuestion: TemplateQuestion | null;
  /** 已回答进度 */
  progress: {
    answered: number;
    total: number;
  };
  /** 是否已完成所有必答问题 */
  completed: boolean;
}

/**
 * 需求澄清 Agent
 *
 * 根据已答情况，计算下一个应该问的问题。
 *
 * TODO: Week 2 实现动态联动逻辑
 */
export async function clarifyNext(
  input: ClarifyInput
): Promise<ClarifyOutput> {
  const questions = input.template.questions;
  const answers = input.answers;

  // 找到第一个未回答的必答问题
  const nextQuestion = questions.find((q) => {
    if (!q.required) return false;
    const answered = answers[q.id];
    return answered === undefined || answered === null || answered === "";
  }) ?? null;

  const answeredCount = questions.filter((q) => {
    const val = answers[q.id];
    return val !== undefined && val !== null && val !== "";
  }).length;

  const requiredCount = questions.filter((q) => q.required).length;

  return {
    nextQuestion,
    progress: {
      answered: answeredCount,
      total: questions.length,
    },
    completed: answeredCount >= requiredCount,
  };
}

/**
 * 根据已回答生成标准化配置对象
 *
 * 将用户回答按 template.json 的 configMapping 映射为嵌套配置对象。
 */
export function buildConfig(
  template: Template,
  answers: Record<string, unknown>
): Record<string, unknown> {
  const config: Record<string, unknown> = {};

  for (const [questionId, configPath] of Object.entries(template.configMapping)) {
    const value = answers[questionId];
    if (value === undefined) continue;
    setByPath(config, configPath, value);
  }

  return config;
}

/**
 * 按 "a.b.c" 路径设置对象属性
 */
function setByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.replace(/^config\./, "").split(".");
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] === undefined || typeof current[part] !== "object") {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
}
