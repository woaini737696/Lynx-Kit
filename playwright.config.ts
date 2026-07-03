/**
 * LynxKit Playwright E2E 配置
 *
 * 范围：Electron 桌面端冒烟测试（_electron 模式）
 * 浏览器：无需 chromium（直接复用 Electron 二进制）
 *
 * 前置：测试前需先 `pnpm --filter @lynxkit/desktop build:electron`
 *       生成 out/main/index.js + out/preload/index.mjs
 * 运行：pnpm test:e2e
 * CI：暂不运行（需独立 workflow + 显示器/Xvfb 配置）
 */

import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // Electron 应用单实例
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1, // Electron 主进程单例
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    actionTimeout: 10_000,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
});
