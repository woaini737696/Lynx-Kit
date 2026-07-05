/**
 * 妙想运营后台 - API 客户端
 *
 * 封装对后端 /api/v1/admin/* 接口的调用。
 * 自动携带 accessToken（localStorage）。
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://miaox.lynxdo.com/api";
const ADMIN_BASE = `${API_BASE}/v1/admin`;
const AUTH_BASE = `${API_BASE}/v1/auth`;

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_access_token");
}

function setToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("admin_access_token", token);
  }
}

function clearToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("admin_refresh_token");
    localStorage.removeItem("admin_user");
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const resp = await fetch(`${ADMIN_BASE}${path}`, {
    ...options,
    headers,
  });

  if (resp.status === 401) {
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("未授权，请重新登录");
  }

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ message: "请求失败" }));
    throw new Error(err.message || `HTTP ${resp.status}`);
  }

  return resp.json() as Promise<T>;
}

export interface AdminUser {
  id: string;
  phone: string;
  email?: string | null;
  name?: string | null;
  avatar?: string | null;
  role: string;
  status: string;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const adminApi = {
  // ===== 认证 =====
  async login(phone: string, password: string) {
    const resp = await fetch(`${AUTH_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ message: "登录失败" }));
      throw new Error(err.message || "登录失败");
    }
    const data = await resp.json();
    setToken(data.accessToken);
    if (typeof window !== "undefined") {
      localStorage.setItem("admin_refresh_token", data.refreshToken);
      localStorage.setItem("admin_user", JSON.stringify(data.user));
    }
    return data;
  },

  logout() {
    clearToken();
  },

  getCurrentUser(): AdminUser | null {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("admin_user");
    return stored ? JSON.parse(stored) : null;
  },

  isLoggedIn(): boolean {
    return !!getToken();
  },

  // ===== 数据看板 =====
  getStats: () => request("/stats"),

  // ===== 用户管理 =====
  getUsers: (params: { page?: number; pageSize?: number; search?: string; status?: string; role?: string }) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && q.set(k, String(v)));
    return request<PageResult<AdminUser>>(`/users?${q}`);
  },
  updateUser: (id: string, data: Partial<AdminUser>) =>
    request(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteUser: (id: string) => request(`/users/${id}`, { method: "DELETE" }),

  // ===== 系统配置 =====
  getConfigs: () => request("/configs"),
  updateConfig: (key: string, value: unknown) =>
    request(`/configs/${key}`, { method: "PUT", body: JSON.stringify({ value }) }),
  deleteConfig: (key: string) => request(`/configs/${key}`, { method: "DELETE" }),

  // ===== AI 应用商店 =====
  getStoreProducts: (params: { page?: number; pageSize?: number; search?: string; status?: string }) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && q.set(k, String(v)));
    return request(`/store?${q}`);
  },
  updateStoreProduct: (id: string, data: Record<string, unknown>) =>
    request(`/store/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteStoreProduct: (id: string) => request(`/store/${id}`, { method: "DELETE" }),

  // ===== 代码库管理 =====
  getBuilds: (params: { page?: number; pageSize?: number; status?: string }) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && q.set(k, String(v)));
    return request(`/builds?${q}`);
  },
  getBuildDetail: (id: string) => request(`/builds/${id}`),
  deleteBuild: (id: string) => request(`/builds/${id}`, { method: "DELETE" }),

  // ===== 模板管理 =====
  getTemplates: () => request("/templates"),
  updateTemplate: (id: string, data: Record<string, unknown>) =>
    request(`/templates/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  // ===== AI 模型管理 =====
  getAiModels: () => request("/ai-models"),
  updateAiModel: (key: string, value: unknown) =>
    request(`/ai-models/${key}`, { method: "PUT", body: JSON.stringify({ value }) }),
  deleteAiModel: (key: string) => request(`/ai-models/${key}`, { method: "DELETE" }),

  // ===== Agent 管理 =====
  getAgents: () => request("/agents"),
  updateAgent: (key: string, value: unknown) =>
    request(`/agents/${key}`, { method: "PUT", body: JSON.stringify({ value }) }),
  deleteAgent: (key: string) => request(`/agents/${key}`, { method: "DELETE" }),

  // ===== 角色管理 =====
  getRoles: () => request("/roles"),

  // ===== 审计日志 =====
  getAudit: (params: { page?: number; pageSize?: number }) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && q.set(k, String(v)));
    return request(`/audit?${q}`);
  },
};
