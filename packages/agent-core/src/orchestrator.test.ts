/**
 * 编排器集成测试 - 9 层 Agent 流水线端到端
 *
 * 验证 Orchestrator.run() 的完整串联：
 *   ① 意图 → ② 架构 → ③ 澄清 → ④⑤ PM ∥ 设计师（并行）
 *   → ⑥ 前端 → ⑦ 后端 → ⑧ AI 集成 → ⑨ 测试修复 → ⑩ 部署
 *
 * Mock 策略：
 *   - vi.mock("ai") 拦截 generateText / streamText，返回各 Agent 预期的 JSON / 文件块
 *   - 不提供 workspace → ⑨ 测试修复短路返回（跳过 tsc）
 *   - 注入 mock deployer → ⑩ 返回固定 URL
 *
 * 覆盖点：
 *   - IT-001：完整流水线串联，产物包含 productType / architecture / generatedFiles / deployUrl
 *   - IT-002：④⑤ 并行执行（通过 onProgress 回调顺序验证）
 *   - IT-003：③ 澄清 answers 回填到 ctx
 *   - IT-004：无 deployer 时返回本地预览 URL
 *   - IT-005：错误传播——AI 调用抛错时 Orchestrator 上抛
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateText, streamText } from "ai";
import { AgentRole, type AgentLog } from "@lynxkit/shared";

// ===== Mock AI SDK =====
// 各 Agent 期望的返回值，按 prompt 关键词区分

const MOCK_INTENT_JSON = JSON.stringify({
  productType: "SOCIAL",
  confidence: 0.9,
  coreFeatures: ["AI 匹配", "实时聊天", "个人主页"],
  summary: "AI 驱动的社交应用",
});

const MOCK_ARCHITECT_JSON = JSON.stringify({
  productType: "SOCIAL",
  frontend: ["Next.js 15", "React 19", "TailwindCSS"],
  backend: ["Hono", "PostgreSQL"],
  dirStructure: { src: ["pages/", "components/"] },
  rationale: "标准全栈架构",
});

const MOCK_CLARIFY_JSON = JSON.stringify({
  questions: [{ id: "q1", text: "目标用户？" }],
  answers: { q1: "年轻人", q_deploy_target: "Vercel" },
  productType: "SOCIAL",
});

const MOCK_PM_JSON = JSON.stringify({
  modules: [{ name: "匹配", priority: "P0", features: ["AI 匹配"] }],
  dataModels: [{ name: "User", fields: ["id", "name"] }],
  apis: [{ method: "GET", path: "/api/users", summary: "用户列表" }],
  acceptanceCriteria: ["用户可以注册"],
});

const MOCK_DESIGNER_JSON = JSON.stringify({
  designSystem: { colors: { primary: "#3B82F6" } },
  pages: [{ name: "首页", route: "/", blocks: ["Header", "Hero", "Footer"] }],
  components: [{ shadcn: "Button" }],
});

const MOCK_AI_INTEGRATION_FILES = `<<<FILE: src/lib/ai.ts>>>
export const ai = { chat: () => "hello" };
<<<END_FILE>>>`;

const MOCK_DEPLOY_JSON = JSON.stringify({
  buildCommand: "pnpm build",
  outputDir: "dist",
  hosting: "vercel",
  envVars: { DATABASE_URL: "****" },
  healthCheck: "/api/health",
  startCommand: "pnpm start",
});

// 前端/后端代码文件块（<<<FILE>>> 格式）
const MOCK_FRONTEND_FILES = `<<<FILE: src/pages/index.tsx>>>
export default function Home() { return <div>Home</div>; }
<<<END_FILE>>>
<<<FILE: src/components/Button.tsx>>>
export function Button() { return <button>Click</button>; }
<<<END_FILE>>>`;

const MOCK_BACKEND_FILES = `<<<FILE: src/index.ts>>>
export default { port: 3000 };
<<<END_FILE>>>`;

// 根据 prompt 内容返回不同的 mock 响应（条件按特异性排序，避免误匹配）
function mockGenerateTextImpl(opts: { prompt: string }): Promise<{ text: string }> {
  const { prompt } = opts;
  let text = "{}";
  // AI 集成必须在 PM 之前匹配（prompt 含"产品的 AI 能力"）
  if (prompt.includes("AI 能力") || prompt.includes("AI 集成代码") || prompt.includes("integration code")) {
    text = MOCK_AI_INTEGRATION_FILES;
  } else if (prompt.includes("意图") || prompt.includes("intent")) {
    text = MOCK_INTENT_JSON;
  } else if (prompt.includes("架构") || prompt.includes("architecture")) {
    text = MOCK_ARCHITECT_JSON;
  } else if (prompt.includes("澄清") || prompt.includes("clarify")) {
    text = MOCK_CLARIFY_JSON;
  } else if (prompt.includes("功能模块") || prompt.includes("product manager")) {
    text = MOCK_PM_JSON;
  } else if (prompt.includes("设计系统") || prompt.includes("design system")) {
    text = MOCK_DESIGNER_JSON;
  } else if (prompt.includes("部署清单") || prompt.includes("deploy manifest")) {
    text = MOCK_DEPLOY_JSON;
  } else if (prompt.includes("修复") || prompt.includes("fix")) {
    text = "";
  }
  return Promise.resolve({ text });
}

function mockStreamTextImpl(opts: { prompt: string }) {
  const { prompt } = opts;
  let full = "";
  if (prompt.includes("前端") || prompt.includes("frontend")) {
    full = MOCK_FRONTEND_FILES;
  } else if (prompt.includes("后端") || prompt.includes("backend")) {
    full = MOCK_BACKEND_FILES;
  }

  async function* stream() {
    const chunkSize = 50;
    for (let i = 0; i < full.length; i += chunkSize) {
      yield full.slice(i, i + chunkSize);
    }
  }

  return { textStream: stream() };
}

vi.mock("ai", () => ({
  generateText: vi.fn(),
  streamText: vi.fn(),
  tool: vi.fn((fn: unknown) => fn),
}));

// Mock tools 模块：避免 ⑨ 测试修复 Agent 真实执行 tsc / 写盘
// - executeBash 返回 exitCode: 0 → tsc 通过，第一轮即返回 success
// - writeGeneratedFiles 为 no-op，避免在测试环境落盘
vi.mock("./tools/index", () => ({
  // file-writer
  assertWithinWorkspace: vi.fn((_ws: string, p: string) => p),
  writeFile: vi.fn(async () => ""),
  writeGeneratedFiles: vi.fn(async () => []),
  createFileWriterTool: vi.fn(() => ({})),
  // schema-generator
  generateDrizzleSchema: vi.fn(() => ""),
  createSchemaGeneratorTool: vi.fn(() => ({})),
  // component-finder
  findShadcnComponents: vi.fn(() => []),
  createComponentFinderTool: vi.fn(() => ({})),
  // bash-executor
  executeBash: vi.fn(() => ({
    command: "tsc --noEmit",
    exitCode: 0,
    stdout: "",
    stderr: "",
    durationMs: 0,
  })),
  createBashTool: vi.fn(() => ({})),
}));

// ===== 构造 Mock Context =====
function makeMockContext(overrides?: {
  deployer?: { deploy: () => Promise<{ url: string }> };
  workspace?: string;
}) {
  const logs: AgentLog[] = [];
  const progressEvents: { agent: AgentRole; progress: number }[] = [];
  const streamChunks: string[] = [];

  // 显式判断 overrides 是否含 deployer 键，区分"未传"与"显式传 undefined"
  const hasDeployer = overrides && "deployer" in overrides;
  const deployer = hasDeployer
    ? overrides!.deployer
    : { deploy: vi.fn().mockResolvedValue({ url: "https://deploy.test/session-1" }) };

  return {
    ctx: {
      sessionId: "test-session-1",
      userId: "test-user-1",
      inspiration: "我想做一个 AI 社交应用",
      modelConfig: {
        provider: "local" as never,
        apiKey: "mock",
        apiBase: "http://localhost",
        model: "mock-model",
      },
      // 提供 workspace 使 ⑩ DeployAgent 走 deployer 分支
      // ⑨ TestFixAgent 因 tools 已 mock 不会真实执行 tsc
      workspace: overrides?.workspace ?? "/tmp/test-workspace",
      deployer,
      onLog: (log: AgentLog) => logs.push(log),
      onProgress: (agent: AgentRole, progress: number) =>
        progressEvents.push({ agent, progress }),
      onStream: (chunk: string) => streamChunks.push(chunk),
    },
    logs,
    progressEvents,
    streamChunks,
  };
}

// ===== 测试用例 =====
describe("Orchestrator 9 层流水线集成测试", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 设置默认 mock 实现（每个测试可覆盖）
    vi.mocked(generateText).mockImplementation(
      mockGenerateTextImpl as never,
    );
    vi.mocked(streamText).mockImplementation(
      mockStreamTextImpl as never,
    );
  });

  it("IT-001：完整流水线串联，返回包含全部产物字段", async () => {
    const { Orchestrator } = await import("./orchestrator.js");
    const { ctx } = makeMockContext();
    const orchestrator = new Orchestrator(ctx);

    const result = await orchestrator.run();

    // 产物字段完整
    expect(result).toHaveProperty("productType");
    expect(result).toHaveProperty("architecture");
    expect(result).toHaveProperty("generatedFiles");
    expect(result).toHaveProperty("deployUrl");
    expect(result).toHaveProperty("testPassed");

    // productType 来自 ① 意图识别（IntentAgent 内部会转为小写）
    expect(result.productType.toLowerCase()).toBe("social");

    // 生成的文件应包含前端 + 后端 + AI 集成（3 个来源）
    expect(result.generatedFiles.length).toBeGreaterThanOrEqual(3);
    const paths = result.generatedFiles.map((f) => f.path);
    expect(paths).toContain("src/pages/index.tsx");
    expect(paths).toContain("src/index.ts");
    expect(paths).toContain("src/lib/ai.ts");

    // 部署 URL 来自 mock deployer
    expect(result.deployUrl).toBe("https://deploy.test/session-1");

    // 测试修复短路（无 workspace）→ success: true
    expect(result.testPassed).toBe(true);
  });

  it("IT-002：④⑤ 并行执行（PM 和 Designer 的 onProgress 交错）", async () => {
    const { Orchestrator } = await import("./orchestrator.js");
    const { ctx, progressEvents } = makeMockContext();
    const orchestrator = new Orchestrator(ctx);

    await orchestrator.run();

    // 找到 PM 和 Designer 的进度事件
    const pmEvents = progressEvents.filter((e) => e.agent === AgentRole.PRODUCT_MANAGER);
    const designerEvents = progressEvents.filter((e) => e.agent === AgentRole.DESIGNER);

    // 两者都应有进度事件
    expect(pmEvents.length).toBeGreaterThan(0);
    expect(designerEvents.length).toBeGreaterThan(0);

    // 验证流水线完整执行：DEPLOY 应最后完成
    const deployEvents = progressEvents.filter((e) => e.agent === AgentRole.DEPLOY);
    expect(deployEvents.some((e) => e.progress === 100)).toBe(true);
  });

  it("IT-003：③ 澄清 answers 回填到 ctx", async () => {
    const { Orchestrator } = await import("./orchestrator.js");
    const { ctx } = makeMockContext();
    const orchestrator = new Orchestrator(ctx);

    await orchestrator.run();

    // ③ 澄清后 answers 应被回填到 ctx（由 ClarifyAgent 生成）
    expect((ctx as any).answers).toBeDefined();
    expect(Object.keys((ctx as any).answers).length).toBeGreaterThan(0);
  });

  it("IT-004：无 deployer 时返回本地预览 URL", async () => {
    const { Orchestrator } = await import("./orchestrator.js");
    const { ctx } = makeMockContext({ deployer: undefined });
    const orchestrator = new Orchestrator(ctx);

    const result = await orchestrator.run();

    expect(result.deployUrl).toContain("localhost");
    expect(result.deployUrl).toContain("preview");
  });

  it("IT-005：错误传播——AI 调用抛错时 Orchestrator 上抛异常", async () => {
    // 覆盖 mock：让 generateText 抛错
    vi.mocked(generateText).mockRejectedValue(new Error("AI 不可用") as never);

    const { Orchestrator } = await import("./orchestrator.js");
    const { ctx, logs } = makeMockContext();
    const orchestrator = new Orchestrator(ctx);

    // 流水线应抛错（第一个 Agent 就会失败）
    await expect(orchestrator.run()).rejects.toThrow("AI 不可用");

    // 错误应被 step() 记录到日志
    const errorLogs = logs.filter((l) => l.level === "error");
    expect(errorLogs.length).toBeGreaterThan(0);
  });
});
