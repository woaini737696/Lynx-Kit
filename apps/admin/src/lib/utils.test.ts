import { describe, expect, it } from "vitest";
import { cn, formatDate, formatPhone } from "./utils";

describe("admin/lib/utils", () => {
	describe("cn", () => {
		it("TC-001：合并多个 class 字符串", () => {
			expect(cn("a", "b", "c")).toBe("a b c");
		});

		it("TC-002：过滤 falsy 值", () => {
			expect(cn("a", false, null, undefined, "", "b")).toBe("a b");
		});

		it("TC-003：使用对象语法条件类", () => {
			expect(cn("base", { active: true, disabled: false })).toBe("base active");
		});

		it("TC-004：tailwind-merge 解析冲突（后者胜）", () => {
			// 同一 tailwind 组的冲突，后者覆盖前者
			expect(cn("px-2", "px-4")).toBe("px-4");
		});

		it("TC-005：不同组的类不互相覆盖", () => {
			expect(cn("px-2", "py-4")).toBe("px-2 py-4");
		});
	});

	describe("formatDate", () => {
		it("TC-006：ISO 字符串格式化为 zh-CN", () => {
			// 固定时间戳，断言非空字符串且包含分隔
			const result = formatDate("2026-07-07T08:30:00.000Z");
			expect(typeof result).toBe("string");
			expect(result.length).toBeGreaterThan(0);
			// zh-CN 格式应包含 "2026" 与 "07" 字样
			expect(result).toMatch(/2026/);
		});

		it("TC-007：Date 对象同样可格式化", () => {
			const result = formatDate(new Date("2026-01-15T10:00:00.000Z"));
			expect(result).toMatch(/2026/);
		});

		it("TC-008：不同 Date 实例返回不同结果", () => {
			const a = formatDate("2026-01-01T00:00:00.000Z");
			const b = formatDate("2026-12-31T23:59:59.000Z");
			expect(a).not.toBe(b);
		});
	});

	describe("formatPhone", () => {
		it("TC-009：11 位手机号格式化为 3-4-4 分组", () => {
			expect(formatPhone("13800001111")).toBe("138 0000 1111");
		});

		it("TC-010：不足 11 位原样返回", () => {
			expect(formatPhone("12345")).toBe("12345");
		});

		it("TC-011：超过 11 位原样返回", () => {
			expect(formatPhone("13800001111999")).toBe("13800001111999");
		});

		it("TC-012：11 位边界值正确分组", () => {
			// 测试号码边界
			expect(formatPhone("18942271267")).toBe("189 4227 1267");
		});
	});
});
