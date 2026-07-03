/**
 * ④ 产品经理 Agent 单元测试
 *
 * 覆盖：
 * - TC-401：LLM 返回 {} 时四字段默认为 []
 * - TC-402：answers 优先级（clarification > ctx.answers > {}）
 * - TC-403：LLM 返回完整 PRD 时四字段保留
 * - TC-404：prompt 包含 intent.summary 与 coreFeatures
 * - TC-405：onLog 与 onProgress 回调被调用
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it("TC-403：LLM 返回完整 PRD 时四字段保留", async () => {
    const { generateText } = await import("ai");
    const mock = vi.mocked(generateText);
    mock.mockResolvedValue({
      text: JSON.stringify({
        modules: [{ name: "匹配", priority: "P0", features: ["AI 匹配"] }],
        dataModels: [{ table: "users", fields: [] }],
        apis: [{ method: "GET", path: "/api/users", summary: "用户列表" }],
        acceptanceCriteria: ["用户可以注册"],
      }),
    } as never);

    const agent = new ProductManagerAgent(makeCtx(), fakeIntent, fakeArch);
    const result = await agent.run();

    expect(result.modules).toHaveLength(1);
    expect(result.modules[0]?.name).toBe("匹配");
    expect(result.modules[0]?.priority).toBe("P0");
    expect(result.dataModels).toHaveLength(1);
    expect(result.apis).toHaveLength(1);
    expect(result.apis[0]?.path).toBe("/api/users");
    expect(result.acceptanceCriteria).toEqual(["用户可以注册"]);
  });

  it("TC-404：prompt 包含 intent.summary 与 coreFeatures", async () => {
    const { generateText } = await import("ai");
    const mock = vi.mocked(generateText);
    mock.mockClear();

    const intent = {
      ...fakeIntent,
      summary: "AI 社交交友平台",
      coreFeatures: ["匹配算法", "实时聊天"],
    };
    const agent = new ProductManagerAgent(makeCtx(), intent, fakeArch);
    await agent.run();

    const prompt = mock.mock.calls[0]?.[0]?.prompt as string;
    expect(prompt).toContain("AI 社交交友平台");
    expect(prompt).toContain("匹配算法");
    expect(prompt).toContain("实时聊天");
  });

  it("TC-405：onLog 与 onProgress 回调被调用", async () => {
    const onLog = vi.fn();
    const onProgress = vi.fn();
    const ctx = makeCtx({ onLog, onProgress });
    const agent = new ProductManagerAgent(ctx, fakeIntent, fakeArch);
    await agent.run();

    expect(onLog).toHaveBeenCalled();
    expect(onProgress).toHaveBeenCalled();
    // 进度应最终达到 100
    expect(onProgress).toHaveBeenCalledWith(expect.anything(), 100);
  });
});
