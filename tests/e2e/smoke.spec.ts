/**
 * LynxKit 桌面端 E2E 冒烟测试
 *
 * 用 Playwright _electron 模式直接启动 Electron 二进制（不需要 chromium 浏览器），
 * 验证 main + preload + renderer 全链路可用性。
 *
 * 前置：apps/desktop 已 build:electron（out/main/index.js + out/preload/index.mjs 存在）
 */

import { _electron as electron, expect, test } from "@playwright/test";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DESKTOP_DIR = resolve(__dirname, "../../apps/desktop");
const MAIN_ENTRY = resolve(DESKTOP_DIR, "out/main/index.js");

test.beforeAll(() => {
  // 防御：缺少构建产物时给出明确指引，避免 Playwright 在 launch 阶段报模糊错误
  if (!existsSync(MAIN_ENTRY)) {
    throw new Error(
      `Electron 主进程产物不存在：${MAIN_ENTRY}\n请先运行：pnpm --filter @lynxkit/desktop build:electron`,
    );
  }
});

test.describe("LynxKit 桌面端冒烟测试", () => {
  test("E2E-001：应用启动并显示首屏", async () => {
    const app = await electron.launch({
      cwd: DESKTOP_DIR,
      args: [MAIN_ENTRY],
      env: {
        ...process.env,
        NODE_ENV: "production", // 走 loadFile 分支，加载 out/renderer/index.html
      },
    });

    const win = await app.firstWindow();

    // 窗口标题应为 LynxKit
    await expect(win).toHaveTitle(/LynxKit/i);

    // root 容器存在且可见
    await expect(win.locator("#root")).toBeVisible();

    // 无致命控制台错误
    const errors: string[] = [];
    win.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await win.waitForTimeout(2000); // 给 SPA 加载留出时间

    await app.close();

    // 允许已知的非阻塞警告，但拒绝未捕获异常
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("favicon") &&
        !e.includes("DevTools") &&
        !e.includes("Download the React DevTools"),
    );
    expect(criticalErrors, `渲染进程致命错误：\n${criticalErrors.join("\n")}`).toEqual([]);
  });

  test("E2E-002：IPC 通道注册并可调用（renderer → preload → main）", async () => {
    const app = await electron.launch({
      cwd: DESKTOP_DIR,
      args: [MAIN_ENTRY],
      env: {
        ...process.env,
        NODE_ENV: "production",
      },
    });

    const win = await app.firstWindow();

    // 等待 preload 暴露 electronAPI
    await win.waitForFunction(
      () => !!(window as unknown as { electronAPI?: unknown }).electronAPI,
      { timeout: 10_000 },
    );

    // 通过 preload 调用 app:get-version IPC，验证 main→preload→renderer 链路
    const version = (await win.evaluate(async () => {
      const api = (window as unknown as {
        electronAPI?: { app?: { getVersion?: () => Promise<string> } };
      }).electronAPI;
      return api?.app?.getVersion?.();
    })) as string;

    expect(version, "IPC 调用应返回版本号").toMatch(/^\d+\.\d+\.\d+/);

    await app.close();
  });
});
