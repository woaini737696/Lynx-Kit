/**
 * ① 意图识别 Agent 单元测试
 *
 * 覆盖：
 * - TC-102：规则匹配 social → productType=SOCIAL
 * - TC-103：LLM 失败回退到规则匹配
 */
import { describe, it, expect, vi } from "vitest";
import { IntentAgent } from "./01-intent";
import type { OrchestratorContext } from "../orchestrator";
import { ProductType } from "@lynxkit/shared";

/** 构造测试用 OrchestratorContext（无需真实 LLM apiKey） */
function makeCtx(inspiration: string): OrchestratorContext {
  return {
    sessionId: "test-session-id",
    userId: "test-user-id",
    inspiration,
    onLog: () => {},
    onProgress: () => {},
    onStream: () => {},
  };
}

describe("IntentAgent", () => {
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
    // 不配置 apiKey，LLM 调用会抛错，IntentAgent 应回退到 matchProductType
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
    };
    const agent = new IntentAgent(ctx);
    await agent.run();

    expect(onLog).toHaveBeenCalled();
    expect(onProgress).toHaveBeenCalled();
  });
});
