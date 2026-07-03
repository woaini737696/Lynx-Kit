/**
 * ⑧ AI 集成 Agent 单元测试
 *
 * 覆盖：
 * - TC-801：aiAbility="文档 RAG" → needRag=true，prompt 含 "是否需要 RAG：是"
 * - TC-802：无 RAG 关键词 → needRag=false，prompt 含 "是否需要 RAG：否"
 * - TC-802b：feature 含「知识库」时 needRag=true
 * - TC-802c：feature 含「文档」时 needRag=true
 * - TC-803：LLM 返回文件块时正确解析
 * - TC-804：默认 aiAbility 为 "对话问答"
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it("TC-802c：feature 含「文档」时 needRag=true", async () => {
    const { generateText } = await import("ai");
    const mock = vi.mocked(generateText);
    mock.mockClear();

    const pmWithDoc = {
      ...fakePM,
      modules: [{ name: "文档问答", priority: "P0", features: ["文档解析"] }],
    } as PMResult;
    const ctx = makeCtx();
    const agent = new AIIntegrationAgent(ctx, pmWithDoc);
    await agent.run();

    const prompt = mock.mock.calls[0]?.[0]?.prompt as string;
    expect(prompt).toContain("是否需要 RAG：是");
  });

  it("TC-803：LLM 返回文件块时正确解析", async () => {
    const { generateText } = await import("ai");
    const mock = vi.mocked(generateText);
    mock.mockResolvedValue({
      text: [
        "<<<FILE: src/lib/ai.ts>>>",
        "export const ai = { chat: () => 'hello' };",
        "<<<END_FILE>>>",
        "",
        "<<<FILE: src/lib/prompts.ts>>>",
        "export const prompt = 'test';",
        "<<<END_FILE>>>",
      ].join("\n"),
    } as never);

    const ctx = makeCtx();
    const agent = new AIIntegrationAgent(ctx, fakePM);
    const result = await agent.run();

    expect(result.files).toHaveLength(2);
    const paths = result.files.map((f) => f.path);
    expect(paths).toContain("src/lib/ai.ts");
    expect(paths).toContain("src/lib/prompts.ts");
    expect(result.files[0]?.language).toBe("typescript");
  });

  it("TC-804：无 answers 时 aiAbility 默认为「对话问答」", async () => {
    const { generateText } = await import("ai");
    const mock = vi.mocked(generateText);
    mock.mockClear();

    const ctx = makeCtx(); // 不传 answers
    const agent = new AIIntegrationAgent(ctx, fakePM);
    await agent.run();

    const prompt = mock.mock.calls[0]?.[0]?.prompt as string;
    // 默认 aiAbility 应为 "对话问答"
    expect(prompt).toContain("用户偏好：对话问答");
    // 默认无 RAG 关键词
    expect(prompt).toContain("是否需要 RAG：否");
  });
});
