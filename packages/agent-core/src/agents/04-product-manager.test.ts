/**
 * ④ 产品经理 Agent 单元测试
 *
 * 覆盖：
 * - TC-401：LLM 返回 {} 时四字段默认为 []
 * - TC-402：answers 优先级（clarification > ctx.answers > {}）
 */
import { describe, it, expect, vi } from "vitest";
import { AIProvider, ProductType } from "@lynxkit/shared";
import type { OrchestratorContext } from "../orchestrator";
import { ProductManagerAgent } from "./04-product-manager";
import type { IntentResult } from "./01-intent";
import type { ArchitectResult } from "./02-architect";

vi.mock("ai", () => ({
  generateText: vi.fn().mockResolvedValue({ text: "{}" }),
}));

function makeCtx(overrides: Partial<OrchestratorContext> = {}): OrchestratorContext {
  return {
    sessionId: "test",
    userId: "test",
    inspiration: "test",
    onLog: () => {},
    onProgress: () => {},
    onStream: () => {},
    modelConfig: {
      provider: AIProvider.LOCAL,
      apiKey: "",
      apiBase: "http://localhost:11434",
      model: "test",
    },
    ...overrides,
  };
}

const fakeIntent = {
  productType: ProductType.SOCIAL,
  summary: "社交应用",
  coreFeatures: ["匹配"],
  confidence: 0.9,
} as IntentResult;

const fakeArch = {
  frontend: ["React"],
  backend: ["Hono"],
} as ArchitectResult;

describe("ProductManagerAgent", () => {
  it("TC-401：LLM 返回 {} 时四字段默认为 []", async () => {
    const agent = new ProductManagerAgent(makeCtx(), fakeIntent, fakeArch);
    const result = await agent.run();
    expect(result.modules).toEqual([]);
    expect(result.dataModels).toEqual([]);
    expect(result.apis).toEqual([]);
    expect(result.acceptanceCriteria).toEqual([]);
  });

  it("TC-402：answers 优先级 clarification > ctx.answers", async () => {
    const { generateText } = await import("ai");
    const mock = vi.mocked(generateText);
    mock.mockClear();

    const ctx = makeCtx({ answers: { ctx_key: "ctx_val" } });
    const clarification = {
      answers: { clarify_key: "clarify_val" },
      productType: ProductType.SOCIAL,
      questions: [],
    };
    const agent = new ProductManagerAgent(
      ctx,
      fakeIntent,
      fakeArch,
      clarification as never,
    );
    await agent.run();

    expect(mock).toHaveBeenCalledTimes(1);
    const prompt = mock.mock.calls[0]?.[0]?.prompt as string;
    // clarification.answers 应优先于 ctx.answers 出现在 prompt 中
    expect(prompt).toContain("clarify_key");
  });
});
