/**
 * LynxKit Web 端冒烟测试
 *
 * 验证营销首页可访问性、关键区块渲染、主导航链接存在。
 * 依赖 webServer（playwright.config.ts 自动启动 `pnpm --filter @lynxkit/web dev`）。
 */

import { expect, test } from "@playwright/test";

test.describe("Web 冒烟测试 - 首页", () => {
  test("首页加载并显示页面标题", async ({ page }) => {
    await page.goto("/");

    // 页面标题应包含品牌名「妙想」
    await expect(page).toHaveTitle(/妙想/);

    // Navbar 品牌名「妙想」可见
    const brand = page.locator("header").getByText("妙想", { exact: true }).first();
    await expect(brand).toBeVisible();
  });

  test("首页主要区块（Navbar + Footer）渲染", async ({ page }) => {
    await page.goto("/");

    // Navbar（<header>）与 Footer 应可见
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();

    // 营销流程区（三步上线）标题可见
    await expect(page.getByRole("heading", { name: "三步即可上线" })).toBeVisible();
  });

  test("主导航链接存在（商店、博客、关于）", async ({ page }) => {
    // 桌面端断点，确保桌面导航可见（md: 以上）
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    const nav = page.locator("header nav").first();
    await expect(nav).toBeVisible();

    // 关键导航链接
    await expect(nav.getByRole("link", { name: "商店" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "博客" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "关于" })).toBeVisible();
  });

  test("Navbar 包含登录与注册入口", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    await expect(page.locator("header").getByRole("link", { name: "登录" })).toBeVisible();
    await expect(page.locator("header").getByRole("link", { name: "免费开始" })).toBeVisible();
  });
});
