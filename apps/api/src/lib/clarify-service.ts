/**
 * 澄清问题服务 - LynxKit API
 *
 * 桥接 @lynxkit/agent-core 的 IntentAgent + ClarifyAgent：
 *   1. 用 IntentAgent 识别产品类型（规则 + LLM fallback）
 *   2. 用 ClarifyAgent 按产品类型生成动态澄清问题
 *
 * 由 POST /agent/:sessionId/clarify 路由调用，替换原静态问题模板。
 */
import {
  IntentAgent,
  ClarifyAgent,
  type ClarifyQuestion,
  type IntentResult,
  type OrchestratorContext,
} from "@lynxkit/agent-core";
import { ProductType } from "@lynxkit/shared";

export interface ClarifyServiceInput {
  sessionId: string;
  userId: string;
  inspiration: string;
  /** 用户已回答的答案（断点续跑时传入） */
  answers?: Record<string, unknown>;
}

export interface ClarifyServiceOutput {
  productType: ProductType;
  questions: ClarifyQuestion[];
  /** IntentAgent 输出，供后续架构师/产品经理 Agent 复用 */
  intent: IntentResult;
  /** ClarifyAgent 合并后的最终答案（含默认值） */
  answers: Record<string, unknown>;
}

/**
 * 生成动态澄清问题。
 *
 * 内部串行执行 IntentAgent → ClarifyAgent：
 *   - IntentAgent 在无 LLM apiKey 时回退到规则匹配，仍可返回 productType
 *   - ClarifyAgent 完全基于规则，按 productType 选 5-8 个问题
 */
export async function generateClarifyQuestions(
  input: ClarifyServiceInput,
): Promise<ClarifyServiceOutput> {
  const ctx: OrchestratorContext = {
    sessionId: input.sessionId,
    userId: input.userId,
    inspiration: input.inspiration,
    answers: input.answers,
    onLog: () => {},
    onProgress: () => {},
    onStream: () => {},
  };

  const intentAgent = new IntentAgent(ctx);
  const intent = await intentAgent.run();

  const clarifyAgent = new ClarifyAgent(ctx, intent);
  const clarify = await clarifyAgent.run();

  return {
    productType: intent.productType,
    questions: clarify.questions,
    intent,
    answers: clarify.answers,
  };
}
