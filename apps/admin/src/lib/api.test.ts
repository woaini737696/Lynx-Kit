/**
 * admin/lib/api 测试
 *
 * 覆盖 adminApi 的认证状态机（isLoggedIn / getCurrentUser / logout）和
 * request<T> 的 401 重定向、错误透传、JSON 解析路径。
 *
 * 使用 vitest mock 替换全局 fetch / localStorage / window.location。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adminApi } from "./api";

// ===== Mock 全局 =====
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: vi.fn((key: string) => store[key] ?? null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value;
		}),
		removeItem: vi.fn((key: string) => {
			delete store[key];
		}),
		clear: vi.fn(() => {
			store = {};
		}),
		_snapshot: () => ({ ...store }),
	};
})();

const fetchMock = vi.fn();

const originalWindow = globalThis.window;
const originalLocal = globalThis.localStorage;
const originalFetch = globalThis.fetch;

beforeEach(() => {
	vi.resetModules();

	// 重新挂载 mock
	Object.defineProperty(globalThis, "localStorage", {
		value: localStorageMock,
		configurable: true,
		writable: true,
	});
	Object.defineProperty(globalThis, "fetch", {
		value: fetchMock,
		configurable: true,
		writable: true,
	});

	// 模拟 window 对象（用于 typeof window !== "undefined" 分支）
	if (!globalThis.window) {
		// @ts-expect-error test stub
		globalThis.window = {
			location: { href: "" },
		};
	}

	localStorageMock.clear();
	localStorageMock.getItem.mockClear();
	localStorageMock.setItem.mockClear();
	localStorageMock.removeItem.mockClear();
	fetchMock.mockClear();
});

afterEach(() => {
	// 还原
	Object.defineProperty(globalThis, "localStorage", {
		value: originalLocal,
		configurable: true,
		writable: true,
	});
	Object.defineProperty(globalThis, "fetch", {
		value: originalFetch,
		configurable: true,
		writable: true,
	});
	globalThis.window = originalWindow;
});

describe("admin/lib/api - 认证状态机", () => {
	describe("isLoggedIn", () => {
		it("TC-001：无 token 时返回 false", () => {
			expect(adminApi.isLoggedIn()).toBe(false);
		});

		it("TC-002：有 token 时返回 true", () => {
			localStorageMock.setItem("admin_access_token", "abc");
			expect(adminApi.isLoggedIn()).toBe(true);
		});
	});

	describe("getCurrentUser", () => {
		it("TC-003：无 admin_user 时返回 null", () => {
			expect(adminApi.getCurrentUser()).toBeNull();
		});

		it("TC-004：有 admin_user 时返回解析后的对象", () => {
			const user = { id: "u1", phone: "138", role: "ADMIN", status: "ACTIVE" };
			localStorageMock.setItem("admin_user", JSON.stringify(user));
			expect(adminApi.getCurrentUser()).toEqual(user);
		});
	});

	describe("logout", () => {
		it("TC-005：清除 access_token / refresh_token / admin_user", () => {
			localStorageMock.setItem("admin_access_token", "t");
			localStorageMock.setItem("admin_refresh_token", "r");
			localStorageMock.setItem("admin_user", "{}");

			adminApi.logout();

			expect(localStorageMock.removeItem).toHaveBeenCalledWith(
				"admin_access_token",
			);
			expect(localStorageMock.removeItem).toHaveBeenCalledWith(
				"admin_refresh_token",
			);
			expect(localStorageMock.removeItem).toHaveBeenCalledWith("admin_user");
		});
	});
});

describe("admin/lib/api - login", () => {
	it("TC-006：登录成功后持久化 token / refresh_token / user", async () => {
		const data = {
			accessToken: "at",
			refreshToken: "rt",
			user: { id: "u1", phone: "138" },
		};
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => data,
		});

		const result = await adminApi.login("138", "pwd");

		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringContaining("/v1/auth/login"),
			expect.objectContaining({
				method: "POST",
				body: JSON.stringify({ phone: "138", password: "pwd" }),
			}),
		);
		expect(result).toEqual(data);
		expect(localStorageMock.setItem).toHaveBeenCalledWith(
			"admin_access_token",
			"at",
		);
		expect(localStorageMock.setItem).toHaveBeenCalledWith(
			"admin_refresh_token",
			"rt",
		);
		expect(localStorageMock.setItem).toHaveBeenCalledWith(
			"admin_user",
			JSON.stringify(data.user),
		);
	});

	it("TC-007：登录失败（HTTP 非 2xx）抛出错误，且不写入 token", async () => {
		fetchMock.mockResolvedValueOnce({
			ok: false,
			json: async () => ({ message: "密码错误" }),
		});

		await expect(adminApi.login("138", "wrong")).rejects.toThrow("密码错误");
		expect(localStorageMock.setItem).not.toHaveBeenCalled();
	});

	it("TC-008：登录失败且响应无 message 时使用默认文案", async () => {
		fetchMock.mockResolvedValueOnce({
			ok: false,
			json: async () => ({}),
		});

		await expect(adminApi.login("138", "x")).rejects.toThrow("登录失败");
	});
});

describe("admin/lib/api - request (通过 getUsers 覆盖)", () => {
	it("TC-009：携带 Authorization 头（当有 token 时）", async () => {
		localStorageMock.setItem("admin_access_token", "Bearer-XYZ");
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ list: [], total: 0, page: 1, pageSize: 10 }),
		});

		await adminApi.getUsers({ page: 1 });

		const call = fetchMock.mock.calls[0];
		const opts = call[1] as RequestInit;
		const headers = opts.headers as Record<string, string>;
		expect(headers["Authorization"]).toBe("Bearer Bearer-XYZ");
		expect(headers["Content-Type"]).toBe("application/json");
	});

	it("TC-010：无 token 时不带 Authorization 头", async () => {
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ list: [], total: 0, page: 1, pageSize: 10 }),
		});

		await adminApi.getUsers({});

		const opts = fetchMock.mock.calls[0][1] as RequestInit;
		const headers = opts.headers as Record<string, string>;
		expect(headers["Authorization"]).toBeUndefined();
	});

	it("TC-011：getUsers 拼接 page / pageSize / search / status 到 query", async () => {
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ list: [], total: 0, page: 1, pageSize: 10 }),
		});

		await adminApi.getUsers({
			page: 2,
			pageSize: 20,
			search: "tom",
			status: "ACTIVE",
		});

		const url = fetchMock.mock.calls[0][0] as string;
		expect(url).toContain("page=2");
		expect(url).toContain("pageSize=20");
		expect(url).toContain("search=tom");
		expect(url).toContain("status=ACTIVE");
	});

	it("TC-012：getUsers 跳过 falsy 参数", async () => {
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ list: [], total: 0, page: 1, pageSize: 10 }),
		});

		await adminApi.getUsers({ page: 1, search: "", status: undefined });

		const url = fetchMock.mock.calls[0][0] as string;
		expect(url).toContain("page=1");
		expect(url).not.toContain("search=");
		expect(url).not.toContain("status=");
	});

	it("TC-013：401 响应触发 clearToken 并跳转 /login", async () => {
		localStorageMock.setItem("admin_access_token", "expired");
		fetchMock.mockResolvedValueOnce({
			ok: false,
			status: 401,
			json: async () => ({ message: "未授权" }),
		});

		await expect(adminApi.getUsers({})).rejects.toThrow("未授权，请重新登录");

		// 验证 token 被清除
		expect(localStorageMock.removeItem).toHaveBeenCalledWith(
			"admin_access_token",
		);
		// 验证跳转
		// @ts-expect-error test stub
		expect(globalThis.window.location.href).toBe("/login");
	});

	it("TC-014：非 2xx 非 401 抛出后端 message", async () => {
		fetchMock.mockResolvedValueOnce({
			ok: false,
			status: 500,
			json: async () => ({ message: "服务器内部错误" }),
		});

		await expect(adminApi.getUsers({})).rejects.toThrow("服务器内部错误");
	});

	it("TC-015：非 2xx 且响应非 JSON 时使用默认文案", async () => {
		fetchMock.mockResolvedValueOnce({
			ok: false,
			status: 502,
			json: async () => {
				throw new Error("not json");
			},
		});

		await expect(adminApi.getUsers({})).rejects.toThrow("请求失败");
	});
});
