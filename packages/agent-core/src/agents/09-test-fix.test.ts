/**
 * ⑨ 测试修复 Agent 单元测试
 *
 * 覆盖：
 * - TC-901：无 workspace 时短路返回（不调 LLM，直接视为通过）
 * - TC-902：首轮 tsc 通过 → success=true，fixLevel="none"，rounds=1
 * - TC-903：tsc 失败但 LLM 修复后第二轮通过 → 修复路径 L1
 * - TC-904：LLM 无法产出修复（rewritten 为空）→ 升级 L2，返回 pendingChoices
 * - TC-905：3 轮均失败 → 触发 L3 回滚，success=false
 *
 * Mock 策略：
 * - ai.generateText：可控返回 LLM 修复后的文件块
 * - ../tools/index.executeBash：可控 tsc 退出码
 * - ../tools/index.writeGeneratedFiles：no-op，避免真实落盘
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateText } from "ai";
import { executeBash, writeGeneratedFiles } from "../tools/index";
import { AIProvider, FixLevel } from "@lynxkit/shared";
import type { OrchestratorContext } from "../orchestrator";
import { TestFixAgent } from "./09-test-fix";
import type { FrontendDevResult } from "./06-frontend-dev";
import type { BackendDevResult } from "./07-backend-dev";

// Mock AI SDK - generateText 默认返回空字符串
vi.mock("ai", () => ({
  generateText: vi.fn(),
}));

// Mock tools 模块：executeBash 与 writeGeneratedFiles 行为可控
vi.mock("../tools/index", () => ({
  executeBash: vi.fn(),
  writeGeneratedFiles: vi.fn(),
  // file-writer
  assertWithinWorkspace: vi.fn((_ws: string, p: string) => p),
  writeFile: vi.fn(async () => ""),
  createFileWriterTool: vi.fn(() => ({})),
  // schema-generator
  generateDrizzleSchema: vi.fn(() => ""),
  createSchemaGeneratorTool: vi.fn(() => ({})),
  // component-finder
  findShadcnComponents: vi.fn(() => []),
  createComponentFinderTool: vi.fn(() => ({})),
  // bash-executor
  createBashTool: vi.fn(() => ({})),
}));

const mockedGenerateText = vi.mocked(generateText);
const mockedExecuteBash = vi.mocked(executeBash);
const mockedWriteFiles = vi.mocked(writeGeneratedFiles);

function makeCtx(overrides: Partial<OrchestratorContext> = {}): OrchestratorContext {
  return {
    sessionId: "test-session",
    userId: "test-user",
    inspiration: "",
    onLog: () => {},
    onProgress: () => {},
    onStream: () => {},
    // 默认提供 LOCAL provider，避免 resolveConfig 抛 "缺少 apiKey"
    modelConfig: {
      provider: AIProvider.LOCAL,
      apiKey: "",
      apiBase: "http://localhost:11434",
      model: "test",
    },
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

/** 构造 tsc 通过结果 */
function tscPass() {
  return {
    command: "tsc --noEmit",
    exitCode: 0,
    stdout: "",
    stderr: "",
    durationMs: 10,
  };
}

/** 构造 tsc 失败结果 */
function tscFail(stderr = "error TS2322: Type 'string' is not assignable to type 'number'.") {
  return {
    command: "tsc --noEmit",
    exitCode: 1,
    stdout: "",
    stderr,
    durationMs: 10,
  };
}

describe("TestFixAgent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 默认 generateText 返回空，测试可单独覆盖
    mockedGenerateText.mockResolvedValue({ text: "" } as never);
    mockedWriteFiles.mockResolvedValue([] as never);
  });

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
    // 不应调用 LLM 与 tools
    expect(mockedGenerateText).not.toHaveBeenCalled();
    expect(mockedExecuteBash).not.toHaveBeenCalled();
  });

  it("TC-902：首轮 tsc 通过 → success=true, rounds=1, fixLevel=none", async () => {
    mockedExecuteBash.mockReturnValue(tscPass());

    const ctx = makeCtx({ workspace: "/tmp/ws" });
    const agent = new TestFixAgent(ctx, fakeInputs);
    const result = await agent.run();

    expect(result.success).toBe(true);
    expect(result.fixLevel).toBe("none");
    expect(result.rounds).toBe(1);
    expect(result.fixedFiles).toEqual(fakeFiles);
    // 应仅执行 1 次 tsc
    expect(mockedExecuteBash).toHaveBeenCalledTimes(1);
    expect(mockedExecuteBash).toHaveBeenCalledWith(
      "tsc --noEmit",
      expect.objectContaining({ cwd: "/tmp/ws", workspace: "/tmp/ws" }),
    );
    // LLM 不应被调用（首轮就通过）
    expect(mockedGenerateText).not.toHaveBeenCalled();
    // 初始产物应落盘一次
    expect(mockedWriteFiles).toHaveBeenCalledTimes(1);
  });

  it("TC-903：tsc 失败后 LLM 修复，第二轮通过", async () => {
    // 第一轮 tsc 失败，第二轮通过
    mockedExecuteBash
      .mockReturnValueOnce(tscFail())
      .mockReturnValueOnce(tscPass());
    // LLM 返回重写后的文件块
    mockedGenerateText.mockResolvedValue({
      text: "<<<FILE: src/a.ts>>>\nexport const a = 2;\n<<<END_FILE>>>",
    } as never);

    const ctx = makeCtx({ workspace: "/tmp/ws" });
    const agent = new TestFixAgent(ctx, fakeInputs);
    const result = await agent.run();

    expect(result.success).toBe(true);
    expect(result.fixLevel).toBe("none");
    expect(result.rounds).toBe(2);
    // 文件内容应被 LLM 重写覆盖
    expect(result.fixedFiles).toHaveLength(1);
    expect(result.fixedFiles[0]?.content).toBe("export const a = 2;");
    // tsc 应执行 2 次
    expect(mockedExecuteBash).toHaveBeenCalledTimes(2);
    // LLM 应被调用 1 次
    expect(mockedGenerateText).toHaveBeenCalledTimes(1);
  });

  it("TC-904：LLM 无法产出修复时升级 L2，返回 pendingChoices", async () => {
    // tsc 一直失败
    mockedExecuteBash.mockReturnValue(tscFail("error TS1"));
    // LLM 返回空字符串 → parseGeneratedFiles 返回 []
    mockedGenerateText.mockResolvedValue({ text: "" } as never);

    const ctx = makeCtx({ workspace: "/tmp/ws" });
    const agent = new TestFixAgent(ctx, fakeInputs);
    const result = await agent.run();

    expect(result.success).toBe(false);
    expect(result.fixLevel).toBe(FixLevel.L2);
    expect(result.rounds).toBe(1);
    expect(result.errors).toContain("error TS1");
    // 应返回 A/B/C 三个候选选项
    expect(result.pendingChoices).toHaveLength(3);
    const choiceIds = result.pendingChoices?.map((c) => c.id);
    expect(choiceIds).toEqual(["A", "B", "C"]);
    // 只执行了 1 轮 tsc（LLM 失败后立即返回）
    expect(mockedExecuteBash).toHaveBeenCalledTimes(1);
    expect(mockedGenerateText).toHaveBeenCalledTimes(1);
  });

  it("TC-905：3 轮均失败 → 触发 L3 回滚", async () => {
    // tsc 3 轮都失败
    mockedExecuteBash.mockReturnValue(tscFail("persistent error"));
    // LLM 每轮都返回修复文件，但 tsc 仍然失败
    mockedGenerateText.mockResolvedValue({
      text: "<<<FILE: src/a.ts>>>\nexport const a = 999;\n<<<END_FILE>>>",
    } as never);

    const ctx = makeCtx({ workspace: "/tmp/ws" });
    const agent = new TestFixAgent(ctx, fakeInputs);
    const result = await agent.run();

    expect(result.success).toBe(false);
    expect(result.fixLevel).toBe(FixLevel.L3);
    expect(result.rounds).toBe(3);
    expect(result.errors).toContain("persistent error");
    // 不应返回 pendingChoices（L3 直接回滚）
    expect(result.pendingChoices).toBeUndefined();
    // tsc 应执行 3 次，LLM 应执行 3 次
    expect(mockedExecuteBash).toHaveBeenCalledTimes(3);
    expect(mockedGenerateText).toHaveBeenCalledTimes(3);
  });
});
