/**
 * ② 架构师 Agent 单元测试
 *
 * 覆盖：
 * - TC-106：LLM 失败时回退到产品类型 meta 技术栈
 * - TC-107：LLM 返回完整字段时采用 LLM 结果（含 dirStructure/rationale）
 * - TC-108：LLM 返回部分字段时缺失字段用 fallback 补齐
 * - TC-109：LLM 返回空字段（如 frontend=[]）时该字段用 fallback 补齐
 * - 回调验证：onLog 和 onProgress 被调用
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateText } from "ai";
import { AIProvider, ProductType, getProductTypeMeta } from "@lynxkit/shared";
import { ArchitectAgent } from "./02-architect";
import type { OrchestratorContext } from "../orchestrator";
import type { IntentResult } from "./01-intent";

vi.mock("ai", () => ({
  generateText: vi.fn(),
}));

const mockedGenerateText = vi.mocked(generateText);

function makeCtx(): OrchestratorContext {
  return {
    sessionId: "test-architect",
    userId: "test-user",
    inspiration: "AI 社交交友",
    onLog: () => {},
    onProgress: () => {},
    onStream: () => {},
    modelConfig: {
      provider: AIProvider.LOCAL,
      apiKey: "",
      apiBase: "http://localhost:11434",
      model: "test",
    },
  };
}

const socialIntent: IntentResult = {
  productType: ProductType.SOCIAL,
  confidence: 0.8,
  coreFeatures: ["匹配", "聊天"],
  summary: "AI 社交",
};

describe("ArchitectAgent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 默认让 LLM 失败，便于测试 fallback 路径
    mockedGenerateText.mockRejectedValue(new Error("no api key") as never);
  });

  it("TC-106：LLM 失败时回退到产品类型 meta 技术栈", async () => {
    const ctx = makeCtx();
    const intent: IntentResult = {
      productType: ProductType.SOCIAL,
      confidence: 0.8,
      coreFeatures: ["匹配", "聊天"],
      summary: "AI 社交",
    };
    const agent = new ArchitectAgent(ctx, intent);
    const result = await agent.run();

    const meta = getProductTypeMeta(ProductType.SOCIAL);
    expect(meta).toBeDefined();
    // fallback.frontend 取 meta.techStack.slice(0, 4)
    expect(result.frontend).toEqual(meta?.techStack.slice(0, 4));
    expect(result.backend).toEqual(["Hono", "Drizzle ORM", "JWT"]);
    expect(result.database).toEqual(["PostgreSQL"]);
    expect(result.ai).toEqual(["Vercel AI SDK 5.0"]);
    expect(result.deploy).toEqual(["Vercel", "Docker Compose"]);
  });

  it("应调用 onLog 和 onProgress 回调", async () => {
    const onLog = vi.fn();
    const onProgress = vi.fn();
    const ctx: OrchestratorContext = {
      sessionId: "test-cb",
      userId: "test-user",
      inspiration: "AI 数据分析",
      onLog,
      onProgress,
      onStream: () => {},
      modelConfig: {
        provider: AIProvider.LOCAL,
        apiKey: "",
        apiBase: "http://localhost:11434",
        model: "test",
      },
    };
    const agent = new ArchitectAgent(ctx, {
      productType: ProductType.DATA,
      confidence: 0.8,
      coreFeatures: ["报表"],
      summary: "AI 数据分析",
    });
    await agent.run();

    expect(onLog).toHaveBeenCalled();
    expect(onProgress).toHaveBeenCalled();
  });

  it("TC-107：LLM 返回完整字段时采用 LLM 结果（含 dirStructure/rationale）", async () => {
    mockedGenerateText.mockResolvedValue({
      text: JSON.stringify({
        frontend: ["Next.js 15", "React 19", "TailwindCSS"],
        backend: ["Hono", "PostgreSQL"],
        database: ["PostgreSQL", "Redis"],
        ai: ["Vercel AI SDK 5.0"],
        deploy: ["Vercel"],
        dirStructure: { src: ["pages/", "components/"] },
        rationale: "标准全栈架构",
      }),
    } as never);

    const agent = new ArchitectAgent(makeCtx(), socialIntent);
    const result = await agent.run();

    expect(result.frontend).toEqual(["Next.js 15", "React 19", "TailwindCSS"]);
    expect(result.backend).toEqual(["Hono", "PostgreSQL"]);
    expect(result.database).toEqual(["PostgreSQL", "Redis"]);
    expect(result.ai).toEqual(["Vercel AI SDK 5.0"]);
    expect(result.deploy).toEqual(["Vercel"]);
    expect(result.dirStructure).toEqual({ src: ["pages/", "components/"] });
    expect(result.rationale).toBe("标准全栈架构");
  });

  it("TC-108：LLM 返回部分字段时缺失字段用 fallback 补齐", async () => {
    // LLM 仅返回 frontend/backend，缺 database/ai/deploy
    mockedGenerateText.mockResolvedValue({
      text: JSON.stringify({
        frontend: ["Next.js"],
        backend: ["Hono"],
        // database / ai / deploy 缺失
      }),
    } as never);

    const agent = new ArchitectAgent(makeCtx(), socialIntent);
    const result = await agent.run();

    // LLM 提供的字段保留
    expect(result.frontend).toEqual(["Next.js"]);
    expect(result.backend).toEqual(["Hono"]);
    // 缺失字段用 fallback 补齐
    expect(result.database).toEqual(["PostgreSQL"]);
    expect(result.ai).toEqual(["Vercel AI SDK 5.0"]);
    expect(result.deploy).toEqual(["Vercel", "Docker Compose"]);
  });

  it("TC-109：LLM 返回空数组字段时该字段用 fallback 补齐", async () => {
    // LLM 返回 frontend=[]（空数组），应用 fallback
    mockedGenerateText.mockResolvedValue({
      text: JSON.stringify({
        frontend: [],
        backend: ["Hono"],
        database: [],
        ai: [],
        deploy: [],
      }),
    } as never);

    const agent = new ArchitectAgent(makeCtx(), socialIntent);
    const result = await agent.run();

    // 空数组视为缺失，应用 fallback
    const meta = getProductTypeMeta(ProductType.SOCIAL);
    expect(result.frontend).toEqual(meta?.techStack.slice(0, 4));
    expect(result.backend).toEqual(["Hono"]); // backend 非空，保留
    expect(result.database).toEqual(["PostgreSQL"]);
    expect(result.ai).toEqual(["Vercel AI SDK 5.0"]);
    expect(result.deploy).toEqual(["Vercel", "Docker Compose"]);
  });

  it("TC-110：未知产品类型时 fallback.frontend 使用默认 ['Next']", async () => {
    // 构造一个不在 getProductTypeMeta 中的产品类型（理论上不会发生，但应兜底）
    mockedGenerateText.mockRejectedValue(new Error("no api key") as never);

    const agent = new ArchitectAgent(makeCtx(), {
      ...socialIntent,
      productType: "unknown" as ProductType,
    });
    const result = await agent.run();

    // meta 为 undefined → fallback.frontend = ["Next"]
    expect(result.frontend).toEqual(["Next"]);
    expect(result.backend).toEqual(["Hono", "Drizzle ORM", "JWT"]);
  });
});
