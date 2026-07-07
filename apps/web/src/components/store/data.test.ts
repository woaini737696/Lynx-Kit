import { describe, expect, it } from "vitest";
import { STORE_CATEGORIES, STORE_PRODUCTS } from "./data";

describe("web/components/store/data", () => {
	describe("STORE_PRODUCTS", () => {
		it("TC-001：包含 9 个示例商品", () => {
			expect(STORE_PRODUCTS).toHaveLength(9);
		});

		it("TC-002：每个商品 id 唯一", () => {
			const ids = STORE_PRODUCTS.map((p) => p.id);
			const unique = new Set(ids);
			expect(unique.size).toBe(ids.length);
		});

		it("TC-003：每个商品 name 非空", () => {
			for (const p of STORE_PRODUCTS) {
				expect(p.name).toBeTruthy();
				expect(p.name.length).toBeGreaterThan(0);
			}
		});

		it("TC-004：每个商品 description 非空", () => {
			for (const p of STORE_PRODUCTS) {
				expect(p.description).toBeTruthy();
				expect(p.description.length).toBeGreaterThan(0);
			}
		});

		it("TC-005：每个商品 price 为非负整数（分）", () => {
			for (const p of STORE_PRODUCTS) {
				expect(Number.isInteger(p.price)).toBe(true);
				expect(p.price).toBeGreaterThanOrEqual(0);
			}
		});

		it("TC-006：每个商品 rating 在 [0, 5] 区间", () => {
			for (const p of STORE_PRODUCTS) {
				expect(p.rating).toBeGreaterThanOrEqual(0);
				expect(p.rating).toBeLessThanOrEqual(5);
			}
		});

		it("TC-007：每个商品 downloads 为非负整数", () => {
			for (const p of STORE_PRODUCTS) {
				expect(Number.isInteger(p.downloads)).toBe(true);
				expect(p.downloads).toBeGreaterThanOrEqual(0);
			}
		});

		it("TC-008：每个商品 category 非空", () => {
			for (const p of STORE_PRODUCTS) {
				expect(p.category).toBeTruthy();
			}
		});

		it("TC-009：每个商品 creator.name 非空", () => {
			for (const p of STORE_PRODUCTS) {
				expect(p.creator?.name).toBeTruthy();
			}
		});

		it("TC-010：商品 category 全部在 STORE_CATEGORIES 列表内", () => {
			const validSlugs = STORE_CATEGORIES.map((c) => c.slug);
			for (const p of STORE_PRODUCTS) {
				// "all" 不算具体分类
				expect(validSlugs).toContain(p.category);
			}
		});

		it("TC-011：至少存在一个免费商品（price = 0）", () => {
			expect(STORE_PRODUCTS.some((p) => p.price === 0)).toBe(true);
		});

		it("TC-012：至少存在一个付费商品（price > 0）", () => {
			expect(STORE_PRODUCTS.some((p) => p.price > 0)).toBe(true);
		});

		it("TC-013：存在带 tags 的商品", () => {
			expect(STORE_PRODUCTS.some((p) => (p.tags ?? []).length > 0)).toBe(true);
		});
	});

	describe("STORE_CATEGORIES", () => {
		it("TC-014：包含 all 分类作为首项", () => {
			expect(STORE_CATEGORIES[0]?.slug).toBe("all");
			expect(STORE_CATEGORIES[0]?.name).toBe("全部");
		});

		it("TC-015：分类 slug 唯一", () => {
			const slugs = STORE_CATEGORIES.map((c) => c.slug);
			const unique = new Set(slugs);
			expect(unique.size).toBe(slugs.length);
		});

		it("TC-016：每个分类 name 非空", () => {
			for (const c of STORE_CATEGORIES) {
				expect(c.name).toBeTruthy();
			}
		});

		it("TC-017：分类数量与商品类别数量匹配（除 all 外）", () => {
			// STORE_CATEGORIES 共 9 项；第 1 项是 all，其余 8 项应一一对应商品中出现的分类
			const productCategories = new Set(STORE_PRODUCTS.map((p) => p.category));
			const categorySlugs = STORE_CATEGORIES.filter(
				(c) => c.slug !== "all",
			).map((c) => c.slug);
			expect(categorySlugs.length).toBe(productCategories.size);
		});
	});
});
