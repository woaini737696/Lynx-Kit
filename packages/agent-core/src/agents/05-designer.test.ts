/**
 * ⑤ 设计师 Agent 单元测试
 *
 * 覆盖：
 * - TC-501：LLM 返回 {} 时 designSystem 使用默认值
 * - TC-502：theme 默认 "亮色优先"
 */
import { describe, it, expect, vi } from "vitest";
import { AIProvider, ProductType } from "@lynxkit/shared";
import type { OrchestratorContext } from "../orchestrator";
import { DesignerAgent } from "./05-designer";
import type { IntentResult } from "./01-intent";

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

describe("DesignerAgent", () => {
  it("TC-501：LLM 返回 {} 时 designSystem 使用默认值", async () => {
    const agent = new DesignerAgent(makeCtx(), fakeIntent);
    const result = await agent.run();

    expect(result.designSystem.colors.primary).toBe("#3B82F6");
    expect(result.designSystem.font.sans).toBe("Inter, system-ui, sans-serif");
    expect(result.designSystem.radius).toBe("0.5rem");
    expect(result.designSystem.spacing).toBe("Tailwind 4px 基准");
  });

  it("TC-502：theme 默认亮色优先", async () => {
    const agent = new DesignerAgent(makeCtx(), fakeIntent);
    const result = await agent.run();

    expect(result.theme).toBe("亮色优先");
    expect(result.pages).toEqual([]);
    expect(result.components).toEqual([]);
  });
});
