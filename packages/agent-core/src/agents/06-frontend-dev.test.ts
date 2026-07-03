/**
 * ⑥ 前端开发 Agent 单元测试
 *
 * 覆盖：
 * - TC-601：流累积正确拼接 + onStream 每个 delta 调用一次
 * - TC-602：parseGeneratedFiles 正确解析流式输出
 * - TC-603：流为空时返回空文件列表
 * - TC-604：多个 FILE 块时全部解析
 * - TC-605：prompt 包含 architecture.frontend 与 designer 信息
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
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
  } as any);
}

describe("FrontendDevAgent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
    expect(result.files[0]?.content).toBe(
      "export default function App() { return null; }",
    );
  });

  it("TC-603：流为空时返回空文件列表", async () => {
    mockStreamText([]);

    const agent = new FrontendDevAgent(makeCtx(), fakePM, fakeDesigner, fakeArch);
    const result = await agent.run();

    expect(result.files).toEqual([]);
  });

  it("TC-604：多个 FILE 块时全部解析", async () => {
    mockStreamText([
      "<<<FILE: src/pages/index.tsx>>>\nexport default function Home() { return <div/>; }\n<<<END_FILE>>>",
      "\n<<<FILE: src/components/Button.tsx>>>\nexport function Button() { return <button/>; }\n<<<END_FILE>>>",
      "\n<<<FILE: src/lib/utils.ts>>>\nexport const x = 1;\n<<<END_FILE>>>",
    ]);

    const agent = new FrontendDevAgent(makeCtx(), fakePM, fakeDesigner, fakeArch);
    const result = await agent.run();

    expect(result.files).toHaveLength(3);
    const paths = result.files.map((f) => f.path);
    expect(paths).toContain("src/pages/index.tsx");
    expect(paths).toContain("src/components/Button.tsx");
    expect(paths).toContain("src/lib/utils.ts");
    // 各文件 language 应正确推断
    expect(result.files[0]?.language).toBe("tsx");
    expect(result.files[1]?.language).toBe("tsx");
    expect(result.files[2]?.language).toBe("typescript");
  });

  it("TC-605：prompt 包含 architecture.frontend 与 designer 信息", async () => {
    mockStreamText([]);
    mockedStreamText.mockClear();

    const arch = {
      ...fakeArch,
      frontend: ["Next.js 15", "React 19", "TailwindCSS"],
    };
    const designer = {
      ...fakeDesigner,
      designSystem: {
        colors: { primary: "#3B82F6" },
        font: { sans: "Inter" },
        radius: "0.5rem",
        spacing: "4px",
      },
      pages: [{ name: "首页", route: "/", blocks: ["Header"] }],
      components: [{ page: "首页", shadcn: ["Button"] }],
    };

    const agent = new FrontendDevAgent(makeCtx(), fakePM, designer, arch);
    await agent.run();

    expect(mockedStreamText).toHaveBeenCalledTimes(1);
    const opts = mockedStreamText.mock.calls[0]?.[0] as {
      prompt: string;
    };
    expect(opts.prompt).toContain("Next.js 15");
    expect(opts.prompt).toContain("React 19");
    expect(opts.prompt).toContain("TailwindCSS");
    // designSystem 应被序列化到 prompt
    expect(opts.prompt).toContain("#3B82F6");
    expect(opts.prompt).toContain("首页");
  });
});
