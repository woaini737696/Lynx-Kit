/**
 * ② 架构师 Agent 单元测试
 *
 * 覆盖：
 * - TC-106：LLM 失败时回退到产品类型 meta 技术栈
 */
import { describe, it, expect, vi } from "vitest";
import { ArchitectAgent } from "./02-architect";
import type { OrchestratorContext } from "../orchestrator";
import { ProductType, getProductTypeMeta } from "@lynxkit/shared";
import type { IntentResult } from "./01-intent";

function makeCtx(): OrchestratorContext {
  return {
    sessionId: "test-architect",
    userId: "test-user",
    inspiration: "AI 社交交友",
    onLog: () => {},
    onProgress: () => {},
    onStream: () => {},
  };
}

describe("ArchitectAgent", () => {
  it("TC-106：LLM 失败时回退到产品类型 meta 技术栈", async () => {
    // 无 apiKey，LLM 调用会失败，回退到 fallback
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
});
