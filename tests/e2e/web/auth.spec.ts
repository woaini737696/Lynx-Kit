/**
 * LynxKit Web 端认证流程测试
 *
 * 覆盖登录页可访问、表单元素存在、空表单触发原生验证、有效凭据登录成功。
 * 后端独立：通过 page.route 拦截 /v1/auth/login，mock 登录响应。
 */

import { expect, test } from "@playwright/test";

const LOGIN_API_GLOB = "**/v1/auth/login";

test.describe("Web 认证流程 - 登录页", () => {
  test("登录页可访问并显示标题", async ({ page }) => {
    await page.goto("/login");

    // 页面 H1
    await expect(page.getByRole("heading", { name: "登录到 LynxKit" })).toBeVisible();

    // 副标题
    await expect(page.getByText("继续你的造物之旅")).toBeVisible();
  });

  test("登录表单元素存在（邮箱、密码、登录按钮）", async ({ page }) => {
    await page.goto("/login");

    // 邮箱输入框（id=email）
    await expect(page.locator("#email")).toBeVisible();
    // 密码输入框（id=password）
    await expect(page.locator("#password")).toBeVisible();
    // 登录按钮
    await expect(page.getByRole("button", { name: "登录" })).toBeVisible();
  });

  test("空表单提交触发 HTML5 原生验证（不发起 API 请求）", async ({ page }) => {
    // 拦截登录 API；若被调用则 fail
    let apiCalled = false;
    await page.route(LOGIN_API_GLOB, (route) => {
      apiCalled = true;
      return route.continue();
    });

    await page.goto("/login");

    // 不填任何字段，直接点击登录按钮
    await page.getByRole("button", { name: "登录" }).click();

    // 浏览器原生 required 验证：email 字段应处于 valueMissing 状态
    await expect(page.locator("#email")).toHaveJSProperty(
      "validity.valueMissing",
      true,
    );

    // 页面应仍停留在 /login
    await expect(page).toHaveURL(/\/login$/);

    // 不应发起 API 请求
    expect(apiCalled, "空表单不应触发登录 API 调用").toBe(false);
  });

  test("有效凭据登录成功后跳转到商店页（mock 后端）", async ({ page }) => {
    // mock 登录 API，返回有效 token + user
    await page.route(LOGIN_API_GLOB, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          accessToken: "mock-token-e2e-12345",
          user: {
            id: "u_e2e_1",
            name: "E2E 测试创作者",
            email: "e2e@lynxkit.com",
          },
        }),
      });
    });

    await page.goto("/login");

    await page.locator("#email").fill("e2e@lynxkit.com");
    await page.locator("#password").fill("password123");
    await page.getByRole("button", { name: "登录" }).click();

    // 登录成功 → router.push("/store")
    await page.waitForURL("**/store", { timeout: 15_000 });
    await expect(page).toHaveURL(/\/store$/);
  });
});
