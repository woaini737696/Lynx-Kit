/**
 * LynxKit Playwright E2E 配置
 *
 * 通过 projects 同时支持两端 E2E：
 *  1. desktop-electron —— Electron 桌面端冒烟（_electron 模式，复用 Electron 二进制）
 *     复用 tests/e2e/smoke.spec.ts；前置需 `pnpm --filter @lynxkit/desktop build:electron`
 *  2. web-chromium —— Web 端 E2E（chromium 浏览器 + 自动启动 Next.js dev server）
 *     测试位于 tests/e2e/web/
 *
 * 运行：
 *   pnpm e2e                              # 运行所有项目
 *   pnpm e2e --project=web-chromium       # 仅 Web（不需 build:electron）
 *   pnpm e2e --project=desktop-electron   # 仅桌面端（需先 build:electron）
 *
 * 注意：webServer 在顶层声明，即使仅运行 desktop-electron 也会启动 web dev。
 *       如需跳过 web dev server，可用环境变量 PLAYWRIGHT_SKIP_WEBSERVER=1 后单独跑桌面端。
 */

import { defineConfig } from "@playwright/test";

const isCI = !!process.env.CI;
const skipWebServer = !!process.env.PLAYWRIGHT_SKIP_WEBSERVER;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // Electron 应用单实例
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: 1, // Electron 主进程单例
  reporter: isCI ? "github" : "list",
  timeout: 30_000, // per-test 默认 30s
  expect: { timeout: 10_000 },
  use: {
    actionTimeout: 10_000,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  // 自动启动 Web dev server（Next.js on :3000）。
  // CI 上不复用既有 server；本地开发时可复用已经在跑的 dev server。
  ...(skipWebServer
    ? {}
    : {
        webServer: {
          command: "pnpm --filter @lynxkit/web dev",
          url: "http://localhost:3000",
          timeout: 60_000,
          reuseExistingServer: !isCI,
        },
      }),

  projects: [
    // ─── 桌面端 Electron 冒烟测试 ───
    // testDir 显式声明；testMatch 用 glob 匹配 smoke.spec.ts，
    // testIgnore 排除 web/ 子目录（避免误匹配 web/smoke.spec.ts）。
    // 保留原 60s 超时，行为与原配置一致
    {
      name: "desktop-electron",
      testDir: "./tests/e2e",
      testMatch: "smoke.spec.ts",
      testIgnore: "web/**",
      timeout: 60_000,
    },

    // ─── Web 端 E2E（chromium） ───
    // 测试目录：tests/e2e/web/
    {
      name: "web-chromium",
      testDir: "./tests/e2e/web",
      use: {
        browserName: "chromium",
        baseURL: "http://localhost:3000",
        navigationTimeout: 60_000,
      },
    },
  ],
});
