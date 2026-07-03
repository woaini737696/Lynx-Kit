/**
 * ⑨ 测试修复 Agent 单元测试
 *
 * 覆盖：
 * - TC-901：无 workspace 时短路返回（不调 LLM，直接视为通过）
 */
import { describe, it, expect, vi } from "vitest";
import type { OrchestratorContext } from "../orchestrator";
import { TestFixAgent } from "./09-test-fix";
import type { FrontendDevResult } from "./06-frontend-dev";
import type { BackendDevResult } from "./07-backend-dev";

function makeCtx(overrides: Partial<OrchestratorContext> = {}): OrchestratorContext {
  return {
    sessionId: "test-session",
    userId: "test-user",
    inspiration: "",
    onLog: () => {},
    onProgress: () => {},
    onStream: () => {},
    ...overrides,
  };
}

const fakeFiles = [
  { path: "src/a.ts", content: "export const a = 1;", language: "typescript" },
];

const fakeInputs = {
  frontend: { files: fakeFiles } as FrontendDevResult,
  backend: { files: [] } as BackendDevResult,
};

describe("TestFixAgent", () => {
  it("TC-901：无 workspace 时短路返回 success=true 且不调 LLM", async () => {
    const onLog = vi.fn();
    const onProgress = vi.fn();
    const ctx = makeCtx({ onLog, onProgress }); // 不传 workspace
    const agent = new TestFixAgent(ctx, fakeInputs);

    const result = await agent.run();

    expect(result.success).toBe(true);
    expect(result.fixLevel).toBe("none");
    expect(result.rounds).toBe(0);
    expect(result.fixedFiles).toEqual(fakeFiles);
    expect(onProgress).toHaveBeenCalled();
    // 应记录跳过原因日志
    expect(onLog).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("未提供 workspace") }),
    );
  });
});
