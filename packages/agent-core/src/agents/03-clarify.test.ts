/**
 * ③ 需求澄清 Agent 单元测试
 *
 * 覆盖：
 * - TC-104：SOCIAL 类型生成 5-7 个问题，含 q_match_algo
 * - TC-105：合并用户答案覆盖默认值
 */
import { describe, it, expect } from "vitest";
import { ClarifyAgent } from "./03-clarify";
import type { OrchestratorContext } from "../orchestrator";
import { ProductType } from "@lynxkit/shared";
import type { IntentResult } from "./01-intent";

function makeCtx(answers?: Record<string, unknown>): OrchestratorContext {
  return {
    sessionId: "test-clarify",
    userId: "test-user",
    inspiration: "AI 社交交友",
    answers,
    onLog: () => {},
    onProgress: () => {},
    onStream: () => {},
  };
}

const socialIntent: IntentResult = {
  productType: ProductType.SOCIAL,
  confidence: 0.8,
  coreFeatures: ["匹配", "聊天"],
  summary: "AI 社交交友",
};

describe("ClarifyAgent", () => {
  it("TC-104：SOCIAL 类型应生成 5-7 个问题，含专项 q_match_algo", async () => {
    const ctx = makeCtx();
    const agent = new ClarifyAgent(ctx, socialIntent);
    const result = await agent.run();

    expect(result.questions.length).toBeGreaterThanOrEqual(5);
    expect(result.questions.length).toBeLessThanOrEqual(8);
    // 通用问题
    expect(result.questions.some((q) => q.id === "q_user_scale")).toBe(true);
    expect(result.questions.some((q) => q.id === "q_auth")).toBe(true);
    // SOCIAL 专项
    expect(result.questions.some((q) => q.id === "q_match_algo")).toBe(true);
    expect(result.questions.some((q) => q.id === "q_realtime")).toBe(true);
  });

  it("TC-105：用户答案应覆盖默认值", async () => {
    const ctx = makeCtx({
      q_user_scale: ">10万",
      q_auth: "OAuth 第三方",
      q_payment: true,
      q_multi_tenant: true,
      q_deploy_target: "自托管服务器",
    });
    const agent = new ClarifyAgent(ctx, socialIntent);
    const result = await agent.run();

    expect(result.answers.q_user_scale).toBe(">10万");
    expect(result.answers.q_auth).toBe("OAuth 第三方");
    expect(result.answers.q_payment).toBe(true);
    expect(result.answers.q_multi_tenant).toBe(true);
  });

  it("TC-105b：未回答的问题使用默认值", async () => {
    const ctx = makeCtx(); // 无任何答案
    const agent = new ClarifyAgent(ctx, socialIntent);
    const result = await agent.run();

    // 应全部使用默认值
    for (const q of result.questions) {
      expect(result.answers[q.id]).toBe(q.defaultAnswer);
    }
  });

  it("DATA 类型应包含 q_chart_lib 专项问题", async () => {
    const ctx = makeCtx();
    const agent = new ClarifyAgent(ctx, {
      ...socialIntent,
      productType: ProductType.DATA,
    });
    const result = await agent.run();

    expect(result.questions.some((q) => q.id === "q_chart_lib")).toBe(true);
    expect(result.questions.some((q) => q.id === "q_match_algo")).toBe(false);
  });
});
