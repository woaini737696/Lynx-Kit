/**
 * ⑦ 后端开发 Agent 单元测试
 *
 * 覆盖：
 * - TC-701：dataModels 为空时不补 schema.ts
 * - TC-702：LLM 未生成 schema.ts 且 dataModels 非空时补上确定性版本
 * - TC-703：LLM 已生成 schema.ts 时不覆盖
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
  });
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
});
