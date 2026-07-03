/**
 * ① 意图识别 Agent 单元测试
 *
 * 覆盖：
 * - TC-102：规则匹配 social → productType=SOCIAL
 * - TC-103：LLM 失败回退到规则匹配
 * - TC-103b：无任何关键词命中时回退到 SYSTEM 兜底
 * - TC-104a：LLM 高置信度+合法 productType 时采用 LLM 结果
 * - TC-104b：LLM productType 非法时回退到规则匹配
 * - TC-104c：LLM 返回 coreFeatures / summary 时透传到结果
 * - TC-104d：LLM confidence 为字符串时正确转换为数字
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateText } from "ai";
import { AIProvider, ProductType } from "@lynxkit/shared";
import { IntentAgent } from "./01-intent";
import type { OrchestratorContext } from "../orchestrator";

// Mock AI SDK
vi.mock("ai", () => ({
  generateText: vi.fn(),
}));

const mockedGenerateText = vi.mocked(generateText);

/** 构造测试用 OrchestratorContext（默认 LOCAL provider，无需真实 apiKey） */
function makeCtx(inspiration: string): OrchestratorContext {
  return {
    sessionId: "test-session-id",
    userId: "test-user-id",
    inspiration,
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

describe("IntentAgent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 默认让 LLM 调用失败，便于测试规则匹配回退路径
    mockedGenerateText.mockRejectedValue(new Error("no api key") as never);
  });

  it("TC-102：给定社交关键词应识别为 SOCIAL 类型", async () => {
    const ctx = makeCtx("我想做一个 AI 社交交友匹配应用");
    const agent = new IntentAgent(ctx);
    const result = await agent.run();

    expect(result.productType).toBe(ProductType.SOCIAL);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.coreFeatures).toBeInstanceOf(Array);
    expect(result.summary).toBeTruthy();
  });

  it("TC-103：LLM 调用失败时回退到规则匹配", async () => {
    const ctx = makeCtx("数据分析 BI 报表平台");
    const agent = new IntentAgent(ctx);
    const result = await agent.run();

    // 规则匹配应识别为 DATA
    expect(result.productType).toBe(ProductType.DATA);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("TC-103b：无任何关键词命中时回退到 SYSTEM 兜底", async () => {
    const ctx = makeCtx("xyz123 任意无意义内容");
    const agent = new IntentAgent(ctx);
    const result = await agent.run();

    // 兜底应为 SYSTEM，置信度低
    expect(result.productType).toBe(ProductType.SYSTEM);
    expect(result.confidence).toBeLessThanOrEqual(0.5);
  });

  it("应调用 onLog 和 onProgress 回调", async () => {
    const onLog = vi.fn();
    const onProgress = vi.fn();
    const ctx: OrchestratorContext = {
      sessionId: "test-cb",
      userId: "test-user",
      inspiration: "AI 社交交友",
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
    const agent = new IntentAgent(ctx);
    await agent.run();

    expect(onLog).toHaveBeenCalled();
    expect(onProgress).toHaveBeenCalled();
  });

  it("TC-104a：LLM 高置信度+合法 productType 时采用 LLM 结果", async () => {
    // 规则匹配 confidence 上限 0.95，让 LLM 输出更高（0.99）+ 不同类型
    mockedGenerateText.mockResolvedValue({
      text: JSON.stringify({
        productType: "admin",
        confidence: 0.99,
        coreFeatures: ["CRM", "ERP"],
        summary: "AI 管理后台",
      }),
    } as never);

    // 即使 inspiration 含 social 关键词，LLM confidence 更高应胜出
    const ctx = makeCtx("社交交友 应用");
    const agent = new IntentAgent(ctx);
    const result = await agent.run();

    expect(result.productType).toBe(ProductType.ADMIN);
    expect(result.confidence).toBe(0.99);
    expect(result.coreFeatures).toEqual(["CRM", "ERP"]);
    expect(result.summary).toBe("AI 管理后台");
  });

  it("TC-104b：LLM productType 非法时回退到规则匹配", async () => {
    // LLM 返回非合法 productType（不在枚举中），即使 confidence 高也应回退
    mockedGenerateText.mockResolvedValue({
      text: JSON.stringify({
        productType: "unknown_type",
        confidence: 0.99,
        coreFeatures: ["foo"],
        summary: "x",
      }),
    } as never);

    const ctx = makeCtx("AI 社交交友 匹配");
    const agent = new IntentAgent(ctx);
    const result = await agent.run();

    // 应回退到规则匹配（SOCIAL）
    expect(result.productType).toBe(ProductType.SOCIAL);
    // 但 LLM 的 coreFeatures/summary 仍应被使用
    expect(result.coreFeatures).toEqual(["foo"]);
    expect(result.summary).toBe("x");
  });

  it("TC-104c：LLM 无 coreFeatures 时使用兜底「（待 PM 细化）」", async () => {
    mockedGenerateText.mockResolvedValue({
      text: JSON.stringify({
        productType: "social",
        confidence: 0.99,
        // 故意不传 coreFeatures / summary
      }),
    } as never);

    const ctx = makeCtx("xyz 无意义内容");
    const agent = new IntentAgent(ctx);
    const result = await agent.run();

    // coreFeatures 应回到默认占位
    expect(result.coreFeatures).toEqual(["（待 PM 细化）"]);
    // summary 应回退到 inspiration.slice(0, 40)
    expect(result.summary).toBe("xyz 无意义内容");
  });

  it("TC-104d：LLM confidence 为字符串时正确转换为数字", async () => {
    // confidence 字段为字符串 "0.85"，应被 Number() 转换
    mockedGenerateText.mockResolvedValue({
      text: JSON.stringify({
        productType: "data",
        confidence: "0.95", // 字符串
        coreFeatures: ["报表"],
        summary: "数据 BI",
      }),
    } as never);

    // inspiration 不含 social 关键词，让规则匹配 confidence 低
    const ctx = makeCtx("数据 BI 报表平台");
    const agent = new IntentAgent(ctx);
    const result = await agent.run();

    // LLM 应胜出（规则 0.65 < LLM 0.95）
    expect(result.productType).toBe(ProductType.DATA);
    expect(result.confidence).toBe(0.95);
  });
});
