/**
 * LynxKit Web 端商店页测试
 *
 * 商店页使用静态数据（@/components/store/data），不依赖后端 API。
 * 验证页面可访问、商品列表加载、分类筛选可用。
 */

import { expect, test } from "@playwright/test";

test.describe("Web 商店页", () => {
  test("商店页可访问并显示标题", async ({ page }) => {
    await page.goto("/store");

    // 页面标题
    await expect(page).toHaveTitle(/妙想 商店/);

    // 主标题 H1
    await expect(page.getByRole("heading", { name: "妙想 商店" })).toBeVisible();
  });

  test("产品列表加载（至少包含商品卡片）", async ({ page }) => {
    await page.goto("/store");

    // ProductCard 渲染为 <a href="/store/{id}">，至少应有商品卡片
    const productLinks = page.locator('a[href^="/store/"]');
    // 等待至少 1 个商品卡片可见
    await expect(productLinks.first()).toBeVisible();
    // 静态数据有 9 个商品 + 4 个 featured（重复），全部商品区至少应有 9 个
    const count = await productLinks.count();
    expect(count, "商店页应渲染至少 9 个商品卡片").toBeGreaterThanOrEqual(9);

    // 「推荐商品」与「全部商品」两个区块标题可见
    await expect(page.getByRole("heading", { name: "推荐商品" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "全部商品" })).toBeVisible();
  });

  test("搜索框可见", async ({ page }) => {
    await page.goto("/store");

    // SearchBar 占位文本
    const search = page.getByPlaceholder("搜索应用、关键词、作者…");
    await expect(search).toBeVisible();
  });

  test("分类筛选按钮存在并可点击", async ({ page }) => {
    await page.goto("/store");

    // CategoryFilter 渲染为 role=tablist，子项为 role=tab
    const tablist = page.getByRole("tablist");
    await expect(tablist).toBeVisible();

    const tabs = tablist.getByRole("tab");
    const tabCount = await tabs.count();
    // 静态数据有 9 个分类（含"全部"）
    expect(tabCount, "应至少渲染 9 个分类 tab").toBeGreaterThanOrEqual(9);

    // "全部" tab 默认选中
    const allTab = tabs.filter({ hasText: "全部" }).first();
    await expect(allTab).toHaveAttribute("aria-selected", "true");

    // 点击"AI 社交"分类 tab，应切换为选中态
    const socialTab = tabs.filter({ hasText: "AI 社交" }).first();
    await socialTab.click();
    await expect(socialTab).toHaveAttribute("aria-selected", "true");
    // "全部" 应变为非选中
    await expect(allTab).toHaveAttribute("aria-selected", "false");
  });
});
