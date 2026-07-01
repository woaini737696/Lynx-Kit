/**
 * API 调用封装
 * 统一处理：基础路径 / JSON 序列化 / 错误处理 / 鉴权头
 */

export interface ApiRequestOptions extends RequestInit {
  /** JSON body 对象，会自动序列化 */
  json?: unknown;
  /** 是否携带认证 token（默认 true） */
  auth?: boolean;
  /** 自定义认证 token 读取函数 */
  getToken?: () => string | null;
}

export class ApiError extends Error {
  status: number;
  body?: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

const defaultGetToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("lynxkit_token");
};

export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    json,
    auth = true,
    getToken = defaultGetToken,
    headers,
    ...rest
  } = options;

  const finalHeaders = new Headers(headers);
  if (json !== undefined && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }
  if (auth) {
    const token = getToken();
    if (token) {
      finalHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  const url = path.startsWith("http") ? path : `${baseUrl}${path}`;

  const response = await fetch(url, {
    ...rest,
    headers: finalHeaders,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");

  const body = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof body === "object" && body && "message" in body
        ? String((body as { message: unknown }).message)
        : `请求失败：${response.status}`;
    throw new ApiError(message, response.status, body);
  }

  return body as T;
}

export const api = {
  get: <T = unknown>(path: string, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: "GET" }),
  post: <T = unknown>(path: string, json?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: "POST", json }),
  put: <T = unknown>(path: string, json?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: "PUT", json }),
  patch: <T = unknown>(path: string, json?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: "PATCH", json }),
  delete: <T = unknown>(path: string, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: "DELETE" }),
};
