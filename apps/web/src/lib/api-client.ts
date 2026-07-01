import { APP_CONFIG } from "@lynxkit/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * 读取本地存储的 JWT token
 */
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("lynxkit_token");
}

/**
 * 保存 / 清除 token
 * 同时写入 localStorage（供 fetch 注入）与 cookie（供 middleware 鉴权）
 */
export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    window.localStorage.setItem("lynxkit_token", token);
    // 7 天有效期，与 JWT_EXPIRES_IN 对齐
    document.cookie = `lynxkit_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  } else {
    window.localStorage.removeItem("lynxkit_token");
    document.cookie = "lynxkit_token=; path=/; max-age=0";
  }
}

interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

/**
 * 通用 fetch 封装，自动注入 JWT、处理错误与 query 参数
 */
async function request<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { body, params, headers, ...rest } = options;

  const search = params
    ? "?" +
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(
          ([k, v]) =>
            `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
        )
        .join("&")
    : "";

  const res = await fetch(`${API_URL}${path}${search}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { authorization: `Bearer ${getToken()}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const err = await res.json();
      message = err?.error?.message ?? err?.message ?? message;
    } catch {
      // 响应非 JSON，使用默认状态文本
    }
    // 401 时清除失效 token
    if (res.status === 401) setToken(null);
    throw new Error(message);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const apiClient = {
  get: <T>(path: string, params?: FetchOptions["params"]) =>
    request<T>(path, { method: "GET", params }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export { API_URL, APP_CONFIG };
