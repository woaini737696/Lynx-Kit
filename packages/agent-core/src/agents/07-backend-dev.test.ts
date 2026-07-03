/**
 * ⑦ 后端开发 Agent 单元测试
 *
 * 覆盖：
 * - TC-701：dataModels 为空时不补 schema.ts
 * - TC-702：LLM 未生成 schema.ts 且 dataModels 非空时补上确定性版本
 * - TC-703：LLM 已生成 schema.ts 时不覆盖
 * - TC-704：流累积拼接正确，onStream 每个 delta 调用一次
 * - TC-705：LLM 输出多个文件时全部解析保留
 */
import { describe, it, expect, vi } from "vitest";
import { streamText } from "ai";
import { AIProvider } from "@lynxkit/shared";
import type { OrchestratorContext } from "../orchestrator";
import { BackendDevAgent } from "./07-backend-dev";
import type { PMResult } from "./04-product-manager";
import type { ArchitectResult } from "./02-architect";

vi.mock("ai", () => ({
  streamText: vi.fn(),
}));

vi.mock("../tools/schema-generator", () => ({
  generateDrizzleSchema: vi.fn().mockReturnValue("// deterministic-fake-schema"),
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

const fakeArch = {
  frontend: ["React"],
  backend: ["Hono"],
} as ArchitectResult;

function mockStreamText(chunks: string[]) {
  mockedStreamText.mockReturnValue({
    textStream: {
      async *[Symbol.asyncIterator]() {
        for (const c of chunks) yield c;
      },
    },
  } as any);
}

describe("BackendDevAgent", () => {
  it("TC-701：dataModels 为空时不补 schema.ts", async () => {
    mockStreamText([
      "<<<FILE: src/api.ts>>>\nexport default 1;\n<<<END_FILE>>>",
    ]);

    const pmEmpty = {
      modules: [],
      dataModels: [], // 空
      apis: [],
      acceptanceCriteria: [],
    } as PMResult;

    const agent = new BackendDevAgent(makeCtx(), pmEmpty, fakeArch);
    const result = await agent.run();

    // 只有 LLM 生成的 api.ts，不补 schema.ts
    expect(result.files).toHaveLength(1);
    expect(result.files.some((f) => f.path.endsWith("schema.ts"))).toBe(false);
  });

  it("TC-702：LLM 未生成 schema.ts 且 dataModels 非空时补上确定性版本", async () => {
    mockStreamText([
      "<<<FILE: src/api.ts>>>\nexport default 1;\n<<<END_FILE>>>",
    ]);

    const pmWithData = {
      modules: [],
      dataModels: [{ name: "users", fields: [] } as never],
      apis: [],
      acceptanceCriteria: [],
    } as PMResult;

    const agent = new BackendDevAgent(makeCtx(), pmWithData, fakeArch);
    const result = await agent.run();

    // 应有 2 个文件：LLM 生成的 api.ts + 补上的 schema.ts
    expect(result.files).toHaveLength(2);
    const schemaFile = result.files.find((f) => f.path.endsWith("schema.ts"));
    expect(schemaFile).toBeDefined();
    expect(schemaFile?.content).toBe("// deterministic-fake-schema");
    expect(schemaFile?.language).toBe("typescript");
  });

  it("TC-703：LLM 已生成 schema.ts 时不覆盖", async () => {
    mockStreamText([
      "<<<FILE: src/db/schema.ts>>>\n// llm-generated\n<<<END_FILE>>>",
      "\n<<<FILE: src/api.ts>>>\nexport default 1;\n<<<END_FILE>>>",
    ]);

    const pmWithData = {
      modules: [],
      dataModels: [{ name: "users", fields: [] } as never],
      apis: [],
      acceptanceCriteria: [],
    } as PMResult;

    const agent = new BackendDevAgent(makeCtx(), pmWithData, fakeArch);
    const result = await agent.run();

    // 应只有 2 个文件（不补第三个）
    expect(result.files).toHaveLength(2);
    const schemaFile = result.files.find((f) => f.path.endsWith("schema.ts"));
    expect(schemaFile?.content).toBe("// llm-generated");
  });

  it("TC-704：流累积拼接正确，onStream 每个 delta 调用一次", async () => {
    const onStream = vi.fn();
    mockStreamText(["a", "b", "c"]);

    const pmEmpty = {
      modules: [],
      dataModels: [],
      apis: [],
      acceptanceCriteria: [],
    } as PMResult;

    const ctx = makeCtx({ onStream });
    const agent = new BackendDevAgent(ctx, pmEmpty, fakeArch);
    await agent.run();

    expect(onStream).toHaveBeenCalledTimes(3);
    expect(onStream).toHaveBeenNthCalledWith(1, "a");
    expect(onStream).toHaveBeenNthCalledWith(2, "b");
    expect(onStream).toHaveBeenNthCalledWith(3, "c");
  });

  it("TC-705：LLM 输出多个文件时全部解析保留", async () => {
    mockStreamText([
      "<<<FILE: src/api.ts>>>\nexport default 1;\n<<<END_FILE>>>\n",
      "<<<FILE: src/middleware/auth.ts>>>\nexport const auth = 1;\n<<<END_FILE>>>\n",
      "<<<FILE: src/db/schema.ts>>>\n// llm-schema\n<<<END_FILE>>>",
    ]);

    const pmWithData = {
      modules: [],
      dataModels: [{ name: "users", fields: [] } as never],
      apis: [],
      acceptanceCriteria: [],
    } as PMResult;

    const agent = new BackendDevAgent(makeCtx(), pmWithData, fakeArch);
    const result = await agent.run();

    // 3 个 LLM 生成的文件，schema.ts 已存在不补
    expect(result.files).toHaveLength(3);
    const paths = result.files.map((f) => f.path);
    expect(paths).toContain("src/api.ts");
    expect(paths).toContain("src/middleware/auth.ts");
    expect(paths).toContain("src/db/schema.ts");
    // schema.ts 应保持 LLM 版本（不被确定性版本覆盖）
    const schemaFile = result.files.find((f) => f.path.endsWith("schema.ts"));
    expect(schemaFile?.content).toBe("// llm-schema");
  });

  it("TC-706：dataModels 为空且 LLM 输出空内容时返回空文件列表", async () => {
    mockStreamText(["无任何文件块的纯文本输出"]);

    const pmEmpty = {
      modules: [],
      dataModels: [],
      apis: [],
      acceptanceCriteria: [],
    } as PMResult;

    const agent = new BackendDevAgent(makeCtx(), pmEmpty, fakeArch);
    const result = await agent.run();

    expect(result.files).toEqual([]);
  });

  it("TC-707：PM 含 modules/apis 时 prompt 应包含模块与 API 信息", async () => {
    mockedStreamText.mockClear();
    mockStreamText([]);

    const pmWithData = {
      modules: [
        { name: "用户管理", priority: "P0" as const, features: ["注册", "登录"] },
      ],
      dataModels: [],
      apis: [
        {
          method: "POST",
          path: "/api/users",
          summary: "创建用户",
          request: { name: "string" },
          response: { id: "number" },
        },
      ],
      acceptanceCriteria: [],
    } as unknown as PMResult;

    const agent = new BackendDevAgent(makeCtx(), pmWithData, fakeArch);
    await agent.run();

    expect(mockedStreamText).toHaveBeenCalledTimes(1);
    const opts = mockedStreamText.mock.calls[0]?.[0] as { prompt: string };
    // prompt 应包含模块名、优先级与功能
    expect(opts.prompt).toContain("用户管理");
    expect(opts.prompt).toContain("P0");
    expect(opts.prompt).toContain("注册");
    // prompt 应包含 API 列表
    expect(opts.prompt).toContain("POST");
    expect(opts.prompt).toContain("/api/users");
    expect(opts.prompt).toContain("创建用户");
  });
});
