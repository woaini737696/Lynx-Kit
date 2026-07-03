/**
 * ⑥ 前端开发 Agent 单元测试
 *
 * 覆盖：
 * - TC-601：流累积正确拼接 + onStream 每个 delta 调用一次
 * - TC-602：parseGeneratedFiles 正确解析流式输出
 */
import { describe, it, expect, vi } from "vitest";
import { streamText } from "ai";
import { AIProvider } from "@lynxkit/shared";
import type { OrchestratorContext } from "../orchestrator";
import { FrontendDevAgent } from "./06-frontend-dev";
import type { PMResult } from "./04-product-manager";
import type { DesignerResult } from "./05-designer";
import type { ArchitectResult } from "./02-architect";

vi.mock("ai", () => ({
  streamText: vi.fn(),
}));

const mockedStreamText = vi.mocked(streamText);

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
  modules: [],
  dataModels: [],
  apis: [],
  acceptanceCriteria: [],
} as PMResult;

const fakeDesigner = {
  designSystem: { colors: {}, font: {}, radius: "0.5rem", spacing: "4px" },
  pages: [],
  components: [],
  theme: "亮色优先",
} as DesignerResult;

const fakeArch = {
  frontend: ["React"],
  backend: ["Hono"],
} as ArchitectResult;

/** 构造 streamText mock，yield 给定 chunk 序列 */
function mockStreamText(chunks: string[]) {
  mockedStreamText.mockReturnValue({
    textStream: {
      async *[Symbol.asyncIterator]() {
        for (const c of chunks) yield c;
      },
    },
  });
}

describe("FrontendDevAgent", () => {
  it("TC-601：流累积拼接 + onStream 每个 delta 调用一次", async () => {
    const onStream = vi.fn();
    mockStreamText(["chunk1", "chunk2", "chunk3"]);

    const ctx = makeCtx({ onStream });
    const agent = new FrontendDevAgent(ctx, fakePM, fakeDesigner, fakeArch);
    await agent.run();

    // onStream 应被调用 3 次（每个 delta 一次）
    expect(onStream).toHaveBeenCalledTimes(3);
    expect(onStream).toHaveBeenNthCalledWith(1, "chunk1");
    expect(onStream).toHaveBeenNthCalledWith(2, "chunk2");
    expect(onStream).toHaveBeenNthCalledWith(3, "chunk3");
  });

  it("TC-602：parseGeneratedFiles 正确解析流式输出", async () => {
    mockStreamText([
      "<<<FILE: src/App.tsx>>>\n",
      "export default function App() { return null; }\n",
      "<<<END_FILE>>>",
    ]);

    const agent = new FrontendDevAgent(makeCtx(), fakePM, fakeDesigner, fakeArch);
    const result = await agent.run();

    expect(result.files).toHaveLength(1);
    expect(result.files[0]?.path).toBe("src/App.tsx");
    expect(result.files[0]?.language).toBe("tsx");
  });
});
