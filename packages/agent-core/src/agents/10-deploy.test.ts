/**
 * ⑩ 部署发布 Agent 单元测试
 *
 * 覆盖：
 * - TC-1001：无 deployer 时返回本地预览 URL
 * - TC-1002：有 deployer+workspace 时调用 deployer.deploy
 * - TC-1003：LLM 返回 manifest 时正确解析
 * - TC-1004：prompt 包含文件清单与部署偏好
 * - TC-1005：有 deployer 但无 workspace 时仍走本地预览分支
 * - TC-1006：deployer.deploy 抛错时异常向上传播
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateText } from "ai";
import { AIProvider } from "@lynxkit/shared";
import type { OrchestratorContext } from "../orchestrator";
import { DeployAgent } from "./10-deploy";
import type { GeneratedFile } from "../types";

vi.mock("ai", () => ({
  generateText: vi.fn(),
}));

const mockedGenerateText = vi.mocked(generateText);

function makeCtx(overrides: Partial<OrchestratorContext> = {}): OrchestratorContext {
  return {
    sessionId: "deploy-session",
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

const fakeFiles: GeneratedFile[] = [
  { path: "src/index.ts", content: "export default 1;", language: "typescript" },
];

const mockManifest = {
  buildCommand: "pnpm build",
  outputDir: "dist",
  hosting: "vercel" as const,
  envVars: { DATABASE_URL: "****" },
  healthCheck: "/health",
  startCommand: "pnpm start",
};

describe("DeployAgent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGenerateText.mockResolvedValue({ text: JSON.stringify(mockManifest) } as never);
  });

  it("TC-1001：无 deployer 时返回本地预览 URL", async () => {
    const agent = new DeployAgent(makeCtx(), fakeFiles); // 不传 deployer
    const result = await agent.run();

    expect(result.url).toBe("http://localhost:3000/preview/deploy-session");
    expect(result.manifest.hosting).toBe("vercel");
    expect(result.manifest.buildCommand).toBe("pnpm build");
    expect(result.manifest.healthCheck).toBe("/health");
  });

  it("TC-1002：有 deployer+workspace 时调用 deployer.deploy", async () => {
    const deploy = vi.fn().mockResolvedValue({ url: "https://myapp.vercel.app" });
    const ctx = makeCtx({
      deployer: { deploy },
      workspace: "/tmp/workspace",
    });
    const agent = new DeployAgent(ctx, fakeFiles);
    const result = await agent.run();

    expect(result.url).toBe("https://myapp.vercel.app");
    expect(deploy).toHaveBeenCalledTimes(1);
    expect(deploy).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "deploy-session",
        files: fakeFiles,
        workspace: "/tmp/workspace",
      }),
    );
  });

  it("TC-1003：LLM 返回 manifest 时正确解析", async () => {
    mockedGenerateText.mockResolvedValue({
      text: JSON.stringify({
        buildCommand: "npm run build",
        outputDir: ".next",
        hosting: "docker",
        envVars: { NODE_ENV: "production", DATABASE_URL: "postgres://..." },
        healthCheck: "/api/health",
        startCommand: "npm start",
      }),
    } as never);

    const agent = new DeployAgent(makeCtx(), fakeFiles);
    const result = await agent.run();

    expect(result.manifest.buildCommand).toBe("npm run build");
    expect(result.manifest.outputDir).toBe(".next");
    expect(result.manifest.hosting).toBe("docker");
    expect(result.manifest.envVars.NODE_ENV).toBe("production");
    expect(result.manifest.startCommand).toBe("npm start");
  });

  it("TC-1004：prompt 包含文件清单与部署偏好", async () => {
    mockedGenerateText.mockClear();

    const ctx = makeCtx({
      answers: { q_deploy_target: "自托管服务器" },
    });
    const agent = new DeployAgent(ctx, fakeFiles);
    await agent.run();

    expect(mockedGenerateText).toHaveBeenCalledTimes(1);
    const opts = mockedGenerateText.mock.calls[0]?.[0] as { prompt: string };
    // prompt 应包含文件清单
    expect(opts.prompt).toContain("src/index.ts");
    expect(opts.prompt).toContain("1 个"); // 文件数
    // prompt 应包含部署偏好
    expect(opts.prompt).toContain("自托管服务器");
  });

  it("TC-1005：有 deployer 但无 workspace 时仍走本地预览分支", async () => {
    const deploy = vi.fn();
    const ctx = makeCtx({
      deployer: { deploy },
      // 不提供 workspace
    });
    const agent = new DeployAgent(ctx, fakeFiles);
    const result = await agent.run();

    // 因 workspace 缺失，走本地预览 URL 分支
    expect(result.url).toBe("http://localhost:3000/preview/deploy-session");
    // deployer.deploy 不应被调用
    expect(deploy).not.toHaveBeenCalled();
  });

  it("TC-1006：deployer.deploy 抛错时异常向上传播", async () => {
    const deploy = vi.fn().mockRejectedValue(new Error("部署失败：网络不可达"));
    const ctx = makeCtx({
      deployer: { deploy },
      workspace: "/tmp/workspace",
    });
    const agent = new DeployAgent(ctx, fakeFiles);

    // 异常应被向上抛
    await expect(agent.run()).rejects.toThrow("部署失败：网络不可达");
    expect(deploy).toHaveBeenCalledTimes(1);
  });
});
