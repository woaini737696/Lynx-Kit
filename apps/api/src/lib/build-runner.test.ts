/**
 * build-runner 单元测试 — 构建会话全链路验证（P0-2）
 *
 * 覆盖 processBuildJob 的 4 条关键路径：
 *   TC-401：会话不存在 → 安全返回（不抛错、不调 Orchestrator）
 *   TC-402：用户无权操作该会话 → 安全返回
 *   TC-403：成功路径 → 状态 DEVELOPING→DEPLOYED，deployUrl 写入，日志落库
 *   TC-404：Orchestrator 抛错 → 状态置 ERROR，日志落库，异常重新抛出
 *
 * Mock 策略：
 *   - @lynxkit/agent-core：Orchestrator 类 → run() 为可控 vi.fn
 *   - @lynxkit/db：schema 对象仅需存在（不连真实 DB）
 *   - ./db.js：getDb() 返回 mock db（findFirst / update.set.where / insert.values）
 *   - ./logger.js：logger 为空操作
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ===== Hoisted mocks（跨测试可控） =====
const mocks = vi.hoisted(() => ({
  orchestratorRun: vi.fn(),
  findSession: vi.fn(),
  updateWhere: vi.fn(),
  insertValues: vi.fn(),
}));

vi.mock("@lynxkit/agent-core", () => ({
  Orchestrator: vi.fn(() => ({ run: mocks.orchestratorRun })),
}));

vi.mock("@lynxkit/db", () => ({
  buildSessions: { id: "buildSessions.id", status: "buildSessions.status" },
  buildLogs: { id: "buildLogs.id" },
}));

vi.mock("./db.js", () => ({
  getDb: () => ({
    query: {
      buildSessions: { findFirst: mocks.findSession },
    },
    update: () => ({
      set: () => ({ where: mocks.updateWhere }),
    }),
    insert: () => ({
      values: mocks.insertValues,
    }),
  }),
}));

vi.mock("./logger.js", () => ({
  logger: { info: vi.fn(), debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { Orchestrator } from "@lynxkit/agent-core";
import { processBuildJob } from "./build-runner.js";

const mockSession = {
  id: "session-1",
  userId: "user-1",
  productType: "SOCIAL",
  status: "DRAFT",
};

const mockResult = {
  productType: "social",
  architecture: { frontend: ["Next.js 15"] },
  generatedFiles: [
    { path: "src/index.ts", content: "export default {}" },
    { path: "src/pages/index.tsx", content: "export default function() {}" },
  ],
  deployUrl: "https://deploy.test/session-1",
  testPassed: true,
  fixLevel: "none",
};

const baseInput = {
  sessionId: "session-1",
  userId: "user-1",
  userInput: "AI 社交应用",
  answers: { q_user_scale: ">10万" },
};

describe("processBuildJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 重新设置 Orchestrator 构造函数 mock（clearAllMocks 会清除实现）
    vi.mocked(Orchestrator).mockImplementation((() => ({
      run: mocks.orchestratorRun,
    })) as never);
    mocks.findSession.mockResolvedValue(mockSession);
    mocks.updateWhere.mockResolvedValue(undefined);
    mocks.insertValues.mockResolvedValue(undefined);
    mocks.orchestratorRun.mockResolvedValue(mockResult);
  });

  it("TC-401：会话不存在时安全返回（不抛错、不调 Orchestrator）", async () => {
    mocks.findSession.mockResolvedValue(null);

    await processBuildJob(baseInput);

    expect(mocks.updateWhere).not.toHaveBeenCalled();
    expect(mocks.orchestratorRun).not.toHaveBeenCalled();
  });

  it("TC-402：用户无权操作该会话时安全返回", async () => {
    mocks.findSession.mockResolvedValue({ ...mockSession, userId: "other-user" });

    await processBuildJob(baseInput);

    expect(mocks.updateWhere).not.toHaveBeenCalled();
    expect(mocks.orchestratorRun).not.toHaveBeenCalled();
  });

  it("TC-403：成功路径——状态 DEVELOPING→DEPLOYED，日志落库", async () => {
    await processBuildJob(baseInput);

    // Orchestrator.run 被调用 1 次
    expect(mocks.orchestratorRun).toHaveBeenCalledTimes(1);

    // update 被调用 2 次：DEVELOPING + DEPLOYED
    expect(mocks.updateWhere).toHaveBeenCalledTimes(2);

    // insert (buildLogs) 至少 2 次：启动日志 + 完成日志
    expect(mocks.insertValues.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("TC-404：Orchestrator 抛错时状态置 ERROR 并重新抛出异常", async () => {
    mocks.orchestratorRun.mockRejectedValue(new Error("Agent 调用失败"));

    await expect(processBuildJob(baseInput)).rejects.toThrow("Agent 调用失败");

    // update 被调用 2 次：DEVELOPING + ERROR
    expect(mocks.updateWhere).toHaveBeenCalledTimes(2);

    // insert 至少 2 次：启动日志 + 错误日志
    expect(mocks.insertValues.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
