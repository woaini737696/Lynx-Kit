/**
 * ⑩ 部署发布 Agent 单元测试
 *
 * 覆盖：
 * - TC-1001：无 deployer 时返回本地预览 URL
 * - TC-1002：有 deployer 时调用 deployer.deploy
 */
import { describe, it, expect, vi } from "vitest";
import { AIProvider } from "@lynxkit/shared";
import type { OrchestratorContext } from "../orchestrator";
import { DeployAgent } from "./10-deploy";
import type { GeneratedFile } from "../types";

vi.mock("ai", () => ({
  generateText: vi.fn().mockResolvedValue({
    text: JSON.stringify({
      buildCommand: "pnpm build",
      outputDir: "dist",
      hosting: "vercel",
      envVars: {},
      healthCheck: "/health",
      startCommand: "pnpm start",
    }),
  }),
}));

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

describe("DeployAgent", () => {
  it("TC-1001：无 deployer 时返回本地预览 URL", async () => {
    const agent = new DeployAgent(makeCtx(), fakeFiles); // 不传 deployer
    const result = await agent.run();

    expect(result.url).toBe("http://localhost:3000/preview/deploy-session");
    expect(result.manifest.hosting).toBe("vercel");
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
});
