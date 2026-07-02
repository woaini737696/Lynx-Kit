/**
 * clarify-service 单元测试
 *
 * 覆盖：
 * - TC-203：SOCIAL 类型灵感应返回含 q_match_algo 的动态问题
 * - TC-204：返回问题数应为 5-8 条
 * - TC-203b：DATA 类型灵感应返回含 q_chart_lib（非 q_match_algo）
 *
 * 使用真实 IntentAgent + ClarifyAgent（LLM 失败时回退到规则引擎，确定性可测）
 */
import { describe, it, expect } from "vitest";
import {
  generateClarifyQuestions,
  type ClarifyServiceInput,
} from "./clarify-service.js";
import { ProductType } from "@lynxkit/shared";

const baseInput: ClarifyServiceInput = {
  sessionId: "session-1",
  userId: "user-1",
  inspiration: "我想做一个 AI 社交交友匹配应用",
};

describe("generateClarifyQuestions", () => {
  it("TC-203：SOCIAL 类型灵感应返回含 q_match_algo 的动态问题", async () => {
    const result = await generateClarifyQuestions(baseInput);

    expect(result.productType).toBe(ProductType.SOCIAL);
    expect(result.questions.some((q) => q.id === "q_match_algo")).toBe(true);
  });

  it("TC-204：返回问题数应为 5-8 条", async () => {
    const result = await generateClarifyQuestions(baseInput);

    expect(result.questions.length).toBeGreaterThanOrEqual(5);
    expect(result.questions.length).toBeLessThanOrEqual(8);
  });

  it("TC-203b：DATA 类型灵感应返回含 q_chart_lib（非 q_match_algo）", async () => {
    const result = await generateClarifyQuestions({
      ...baseInput,
      inspiration: "数据分析 BI 报表平台",
    });

    expect(result.productType).toBe(ProductType.DATA);
    expect(result.questions.some((q) => q.id === "q_chart_lib")).toBe(true);
    expect(result.questions.some((q) => q.id === "q_match_algo")).toBe(false);
  });
});
