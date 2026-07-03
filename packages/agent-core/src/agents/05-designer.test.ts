/**
 * ⑤ 设计师 Agent 单元测试
 *
 * 覆盖：
 * - TC-501：LLM 返回 {} 时 designSystem 使用默认值
 * - TC-502：theme 默认 "亮色优先"
 * - TC-503：LLM 返回完整设计系统时四字段保留
 * - TC-504：prompt 包含 intent.productType / coreFeatures / summary
 * - TC-505：LLM 仅返回部分字段时缺失字段使用默认值
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it("TC-503：LLM 返回完整设计系统时四字段保留", async () => {
    const { generateText } = await import("ai");
    const mock = vi.mocked(generateText);
    mock.mockResolvedValue({
      text: JSON.stringify({
        designSystem: {
          colors: { primary: "#FF6B35", secondary: "#3B82F6" },
          font: { sans: "Noto Sans SC", mono: "JetBrains Mono" },
          radius: "0.75rem",
          spacing: "8px 基准",
        },
        pages: [
          { name: "首页", route: "/", blocks: ["Header", "Hero", "Footer"] },
          { name: "个人中心", route: "/profile", blocks: ["Header", "Profile"] },
        ],
        components: [{ page: "首页", shadcn: ["Button", "Card"] }],
        theme: "暗色优先",
      }),
    } as never);

    const agent = new DesignerAgent(makeCtx(), fakeIntent);
    const result = await agent.run();

    expect(result.designSystem.colors.primary).toBe("#FF6B35");
    expect(result.designSystem.colors.secondary).toBe("#3B82F6");
    expect(result.designSystem.font.sans).toBe("Noto Sans SC");
    expect(result.designSystem.font.mono).toBe("JetBrains Mono");
    expect(result.designSystem.radius).toBe("0.75rem");
    expect(result.designSystem.spacing).toBe("8px 基准");
    expect(result.pages).toHaveLength(2);
    expect(result.pages[0]?.name).toBe("首页");
    expect(result.components).toHaveLength(1);
    expect(result.theme).toBe("暗色优先");
  });

  it("TC-504：prompt 包含 intent.productType / coreFeatures / summary", async () => {
    const { generateText } = await import("ai");
    const mock = vi.mocked(generateText);
    mock.mockClear();

    const intent = {
      ...fakeIntent,
      productType: ProductType.DATA,
      summary: "数据可视化平台",
      coreFeatures: ["报表", "图表"],
    };
    const agent = new DesignerAgent(makeCtx(), intent);
    await agent.run();

    const prompt = mock.mock.calls[0]?.[0]?.prompt as string;
    expect(prompt).toContain("data");
    expect(prompt).toContain("数据可视化平台");
    expect(prompt).toContain("报表");
    expect(prompt).toContain("图表");
  });

  it("TC-505：LLM 仅返回部分字段时缺失字段使用默认值", async () => {
    // LLM 只返回 theme，缺 designSystem / pages / components
    const { generateText } = await import("ai");
    const mock = vi.mocked(generateText);
    mock.mockResolvedValue({
      text: JSON.stringify({
        theme: "暗色优先",
        // designSystem 缺失，应使用默认值
      }),
    } as never);

    const agent = new DesignerAgent(makeCtx(), fakeIntent);
    const result = await agent.run();

    // theme 应采用 LLM 返回值
    expect(result.theme).toBe("暗色优先");
    // designSystem 应使用默认值
    expect(result.designSystem.colors.primary).toBe("#3B82F6");
    expect(result.designSystem.font.sans).toBe("Inter, system-ui, sans-serif");
    expect(result.designSystem.radius).toBe("0.5rem");
    expect(result.designSystem.spacing).toBe("Tailwind 4px 基准");
    // pages / components 默认 []
    expect(result.pages).toEqual([]);
    expect(result.components).toEqual([]);
  });
});
