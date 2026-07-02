/**
 * build-service 单元测试
 *
 * 覆盖：
 * - TC-201：Redis 不可用时同步执行 processBuildJob，返回 sync=true
 * - TC-202：同步执行时 processBuildJob 收到完整数据（由其负责写 build_logs）
 * - TC-201b：Redis 可用时入队并返回 jobId，不调用同步执行
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock 依赖：queue 与 build-runner 都不真实执行
vi.mock("../lib/queue.js", () => ({
  enqueueBuild: vi.fn(),
}));
vi.mock("../lib/build-runner.js", () => ({
  processBuildJob: vi.fn(),
}));

import { enqueueBuild } from "../lib/queue.js";
import { processBuildJob } from "../lib/build-runner.js";
import {
  startBuildOrSync,
  type BuildStartInput,
} from "./build-service.js";

const mockEnqueueBuild = vi.mocked(enqueueBuild);
const mockProcessBuildJob = vi.mocked(processBuildJob);

const baseInput: BuildStartInput = {
  sessionId: "session-1",
  userId: "user-1",
  userInput: "AI 社交交友应用",
  answers: { q_user_scale: ">10万" },
};

describe("startBuildOrSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("TC-201：Redis 不可用时同步执行 processBuildJob，返回 sync=true 与 DEVELOPING", async () => {
    mockEnqueueBuild.mockResolvedValue(null);
    mockProcessBuildJob.mockResolvedValue(undefined);

    const result = await startBuildOrSync(baseInput);

    expect(result.sync).toBe(true);
    expect(result.jobId).toBeNull();
    expect(result.status).toBe("DEVELOPING");
    expect(result.sessionId).toBe("session-1");
    expect(mockProcessBuildJob).toHaveBeenCalledTimes(1);
  });

  it("TC-202：同步执行时 processBuildJob 收到完整数据（其内部负责写 build_logs）", async () => {
    mockEnqueueBuild.mockResolvedValue(null);
    mockProcessBuildJob.mockResolvedValue(undefined);

    await startBuildOrSync(baseInput);

    // processBuildJob 一旦被调用即会通过其内部 writeLog 写入 build_logs
    expect(mockProcessBuildJob).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "session-1",
        userId: "user-1",
        userInput: "AI 社交交友应用",
        answers: { q_user_scale: ">10万" },
      }),
    );
  });

  it("TC-201b：Redis 可用时入队并返回 jobId，不调用同步执行", async () => {
    mockEnqueueBuild.mockResolvedValue("job-abc");
    mockProcessBuildJob.mockResolvedValue(undefined);

    const result = await startBuildOrSync(baseInput);

    expect(result.sync).toBe(false);
    expect(result.jobId).toBe("job-abc");
    expect(result.status).toBe("DEVELOPING");
    expect(mockProcessBuildJob).not.toHaveBeenCalled();
  });
});
