/**
 * ⑧ AI 集成 Agent 单元测试
 *
 * 覆盖：
 * - TC-801：aiAbility="文档 RAG" → needRag=true，prompt 含 "是否需要 RAG：是"
 * - TC-802：无 RAG 关键词 → needRag=false，prompt 含 "是否需要 RAG：否"
 */
import { describe, it, expect, vi } from "vitest";
import { AIProvider } from "@lynxkit/shared";
import type { OrchestratorContext } from "../orchestrator";
import { AIIntegrationAgent } from "./08-ai-integration";
import type { PMResult } from "./04-product-manager";

vi.mock("ai", () => ({
  generateText: vi.fn().mockResolvedValue({ text: "" }),
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

const fakePM = {
  modules: [{ name: "AI 对话", priority: "P0", features: ["智能问答"] }],
  dataModels: [],
  apis: [],
  acceptanceCriteria: [],
} as PMResult;

describe("AIIntegrationAgent", () => {
  it("TC-801：aiAbility=文档 RAG 时 needRag=true", async () => {
    const { generateText } = await import("ai");
    const mock = vi.mocked(generateText);
    mock.mockClear();

    const ctx = makeCtx({ answers: { q_ai_ability: "文档 RAG" } });
    const agent = new AIIntegrationAgent(ctx, fakePM);
    await agent.run();

    const prompt = mock.mock.calls[0]?.[0]?.prompt as string;
    expect(prompt).toContain("是否需要 RAG：是");
    expect(prompt).toContain("chat / rag");
  });

  it("TC-802：无 RAG 关键词时 needRag=false", async () => {
    const { generateText } = await import("ai");
    const mock = vi.mocked(generateText);
    mock.mockClear();

    const ctx = makeCtx({ answers: { q_ai_ability: "对话问答" } });
    const agent = new AIIntegrationAgent(ctx, fakePM);
    await agent.run();

    const prompt = mock.mock.calls[0]?.[0]?.prompt as string;
    expect(prompt).toContain("是否需要 RAG：否");
    expect(prompt).not.toContain("chat / rag");
  });

  it("TC-802b：feature 含「知识库」时 needRag=true", async () => {
    const { generateText } = await import("ai");
    const mock = vi.mocked(generateText);
    mock.mockClear();

    const pmWithKnowledge = {
      ...fakePM,
      modules: [{ name: "知识库", priority: "P0", features: ["知识库检索"] }],
    } as PMResult;
    const ctx = makeCtx();
    const agent = new AIIntegrationAgent(ctx, pmWithKnowledge);
    await agent.run();

    const prompt = mock.mock.calls[0]?.[0]?.prompt as string;
    expect(prompt).toContain("是否需要 RAG：是");
  });
});
