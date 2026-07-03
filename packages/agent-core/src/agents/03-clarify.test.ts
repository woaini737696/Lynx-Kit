/**
 * ③ 需求澄清 Agent 单元测试
 *
 * 覆盖：
 * - TC-104：SOCIAL 类型生成 5-7 个问题，含 q_match_algo
 * - TC-105：合并用户答案覆盖默认值
 * - TC-105b：未回答的问题使用默认值
 * - TC-301：DATA 类型应包含 q_chart_lib
 * - TC-302：APP 类型应包含 q_platform 专项问题
 * - TC-303：HARDWARE 类型应包含 q_protocol 专项问题
 * - TC-304：WORKSTATION/ADMIN/SYSTEM/MARKETING 走 default 分支，含 q_ai_ability
 * - TC-305：问题总数不超过 8（受 .slice(0, 8) 限制）
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

const baseIntent: IntentResult = {
  productType: ProductType.SOCIAL,
  confidence: 0.8,
  coreFeatures: ["匹配", "聊天"],
  summary: "AI 社交交友",
};

describe("ClarifyAgent", () => {
  it("TC-104：SOCIAL 类型应生成 5-7 个问题，含专项 q_match_algo", async () => {
    const ctx = makeCtx();
    const agent = new ClarifyAgent(ctx, baseIntent);
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
    const agent = new ClarifyAgent(ctx, baseIntent);
    const result = await agent.run();

    expect(result.answers.q_user_scale).toBe(">10万");
    expect(result.answers.q_auth).toBe("OAuth 第三方");
    expect(result.answers.q_payment).toBe(true);
    expect(result.answers.q_multi_tenant).toBe(true);
  });

  it("TC-105b：未回答的问题使用默认值", async () => {
    const ctx = makeCtx(); // 无任何答案
    const agent = new ClarifyAgent(ctx, baseIntent);
    const result = await agent.run();

    // 应全部使用默认值
    for (const q of result.questions) {
      expect(result.answers[q.id]).toBe(q.defaultAnswer);
    }
  });

  it("DATA 类型应包含 q_chart_lib 专项问题", async () => {
    const ctx = makeCtx();
    const agent = new ClarifyAgent(ctx, {
      ...baseIntent,
      productType: ProductType.DATA,
    });
    const result = await agent.run();

    expect(result.questions.some((q) => q.id === "q_chart_lib")).toBe(true);
    expect(result.questions.some((q) => q.id === "q_match_algo")).toBe(false);
  });

  it("TC-302：APP 类型应包含 q_platform 专项问题", async () => {
    const ctx = makeCtx();
    const agent = new ClarifyAgent(ctx, {
      ...baseIntent,
      productType: ProductType.APP,
    });
    const result = await agent.run();

    expect(result.questions.some((q) => q.id === "q_platform")).toBe(true);
    expect(result.questions.some((q) => q.id === "q_match_algo")).toBe(false);
    expect(result.questions.some((q) => q.id === "q_chart_lib")).toBe(false);
    // 验证 q_platform 的默认值
    const platformQ = result.questions.find((q) => q.id === "q_platform");
    expect(platformQ?.defaultAnswer).toBe("iOS+Android（Expo）");
  });

  it("TC-303：HARDWARE 类型应包含 q_protocol 专项问题", async () => {
    const ctx = makeCtx();
    const agent = new ClarifyAgent(ctx, {
      ...baseIntent,
      productType: ProductType.HARDWARE,
    });
    const result = await agent.run();

    expect(result.questions.some((q) => q.id === "q_protocol")).toBe(true);
    // 验证 q_protocol 的默认值
    const protocolQ = result.questions.find((q) => q.id === "q_protocol");
    expect(protocolQ?.defaultAnswer).toBe("MQTT");
    // 不应包含 SOCIAL/DATA 专项
    expect(result.questions.some((q) => q.id === "q_match_algo")).toBe(false);
    expect(result.questions.some((q) => q.id === "q_chart_lib")).toBe(false);
  });

  it("TC-304a：ADMIN 类型走 default 分支，含 q_ai_ability", async () => {
    const ctx = makeCtx();
    const agent = new ClarifyAgent(ctx, {
      ...baseIntent,
      productType: ProductType.ADMIN,
    });
    const result = await agent.run();

    expect(result.questions.some((q) => q.id === "q_ai_ability")).toBe(true);
    const aiQ = result.questions.find((q) => q.id === "q_ai_ability");
    expect(aiQ?.defaultAnswer).toBe("对话问答");
  });

  it("TC-304b：WORKSTATION 类型走 default 分支，含 q_ai_ability", async () => {
    const ctx = makeCtx();
    const agent = new ClarifyAgent(ctx, {
      ...baseIntent,
      productType: ProductType.WORKSTATION,
    });
    const result = await agent.run();

    expect(result.questions.some((q) => q.id === "q_ai_ability")).toBe(true);
  });

  it("TC-305：问题总数不超过 8（slice 限制）", async () => {
    // SOCIAL 类型：5 通用 + 2 专项 = 7，少于 8
    // 但所有走 default 分支的：5 通用 + 1 专项 = 6
    const ctx = makeCtx();
    const agent = new ClarifyAgent(ctx, baseIntent);
    const result = await agent.run();

    expect(result.questions.length).toBeLessThanOrEqual(8);
    expect(result.answers).toBeDefined();
    // answers 应包含每个 question 的答案
    for (const q of result.questions) {
      expect(result.answers).toHaveProperty(q.id);
    }
  });

  it("TC-306：用户部分回答时混合使用答案与默认值", async () => {
    // 仅回答 q_auth，其他应使用默认值
    const ctx = makeCtx({ q_auth: "免登录" });
    const agent = new ClarifyAgent(ctx, baseIntent);
    const result = await agent.run();

    // q_auth 应使用用户答案
    expect(result.answers.q_auth).toBe("免登录");
    // 其他问题应使用默认值（如 q_user_scale 仍为默认 "1000~1万"）
    expect(result.answers.q_user_scale).toBe("1000~1万");
    expect(result.answers.q_payment).toBe(false);
  });
});
