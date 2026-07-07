import { describe, expect, it } from "vitest";
import { createMetadata, rootMetadata, siteConfig } from "./seo";

describe("web/lib/seo", () => {
	describe("siteConfig", () => {
		it("TC-001：包含 name / url / description / ogImage 四字段", () => {
			expect(siteConfig.name).toBe("妙想");
			expect(typeof siteConfig.url).toBe("string");
			expect(siteConfig.url.length).toBeGreaterThan(0);
			expect(typeof siteConfig.description).toBe("string");
			expect(siteConfig.ogImage).toBe("/og.png");
		});
	});

	describe("createMetadata", () => {
		it("TC-002：基础字段透传 title / description", () => {
			const m = createMetadata({
				title: "测试页",
				description: "测试描述",
			});
			expect(m.title).toBe("测试页 | 妙想");
			expect(m.description).toBe("测试描述");
		});

		it("TC-003：title 已含站点名时不追加", () => {
			const m = createMetadata({
				title: "妙想 - 首页",
				description: "d",
			});
			expect(m.title).toBe("妙想 - 首页");
		});

		it("TC-004：path 拼接到 canonical 与 openGraph.url", () => {
			const m = createMetadata({
				title: "t",
				description: "d",
				path: "/store/abc",
			});
			const url = `${siteConfig.url}/store/abc`;
			expect(m.alternates?.canonical).toBe(url);
			expect(m.openGraph?.url).toBe(url);
		});

		it("TC-005：未传 path 时 canonical 等于站点根 URL", () => {
			const m = createMetadata({ title: "t", description: "d" });
			expect(m.alternates?.canonical).toBe(siteConfig.url);
		});

		it("TC-006：未传 image 时使用默认 OG 图", () => {
			const m = createMetadata({ title: "t", description: "d" });
			const imgs = m.openGraph?.images as Array<{ url: string }>;
			expect(imgs[0].url).toBe("/og.png");
			expect(imgs[0].width).toBe(1200);
			expect(imgs[0].height).toBe(630);
		});

		it("TC-007：传入 image 时使用自定义 OG 图", () => {
			const m = createMetadata({
				title: "t",
				description: "d",
				image: "/custom.png",
			});
			const imgs = m.openGraph?.images as Array<{ url: string }>;
			expect(imgs[0].url).toBe("/custom.png");
		});

		it("TC-008：openGraph.locale 固定为 zh_CN", () => {
			const m = createMetadata({ title: "t", description: "d" });
			expect(m.openGraph?.locale).toBe("zh_CN");
		});

		it("TC-009：twitter card 为 summary_large_image", () => {
			const m = createMetadata({ title: "t", description: "d" });
			expect(m.twitter?.card).toBe("summary_large_image");
		});

		it("TC-010：noIndex 为 true 时设置 robots 禁止", () => {
			const m = createMetadata({
				title: "t",
				description: "d",
				noIndex: true,
			});
			expect(m.robots?.index).toBe(false);
			expect(m.robots?.follow).toBe(false);
		});

		it("TC-011：默认 noIndex 为 false 时不设置 robots 字段", () => {
			const m = createMetadata({ title: "t", description: "d" });
			// noIndex=false 时 robots 字段被 spread 省略
			expect(m.robots).toBeUndefined();
		});

		it("TC-012：publishedTime 透传到 openGraph", () => {
			const m = createMetadata({
				title: "t",
				description: "d",
				publishedTime: "2026-07-07T08:00:00Z",
			});
			expect(m.openGraph?.publishedTime).toBe("2026-07-07T08:00:00Z");
		});

		it("TC-013：未传 publishedTime 时不出现该字段", () => {
			const m = createMetadata({ title: "t", description: "d" });
			expect(m.openGraph?.publishedTime).toBeUndefined();
		});
	});

	describe("rootMetadata", () => {
		it("TC-014：metadataBase 为站点 URL", () => {
			expect(rootMetadata.metadataBase?.toString()).toBe(`${siteConfig.url}/`);
		});

		it("TC-015：title.default 包含站点名", () => {
			const title = rootMetadata.title as {
				default: string;
				template: string;
			};
			expect(title.default).toContain("妙想");
			expect(title.template).toBe("%s | 妙想");
		});

		it("TC-016：keywords 含非空数组", () => {
			const kws = rootMetadata.keywords as string[];
			expect(Array.isArray(kws)).toBe(true);
			expect(kws.length).toBeGreaterThan(0);
			expect(kws).toContain("妙想");
			expect(kws).toContain("AI 构建");
		});

		it("TC-017：robots 默认允许 index/follow", () => {
			expect(rootMetadata.robots?.index).toBe(true);
			expect(rootMetadata.robots?.follow).toBe(true);
		});
	});
});
