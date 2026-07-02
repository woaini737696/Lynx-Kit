/**
 * 核心跨端 fetch 客户端
 *
 * 设计目标：
 * - 跨端可用（Web / Electron / React Native），仅依赖全局 fetch，不依赖 React
 * - 类型安全：可选传入 Zod schema 对响应做运行时校验
 * - 错误统一：所有非 2xx 响应抛出 ApiError
 * - SSE 流式：通过 async generator 消费 text/event-stream（用于 Agent 流式响应）
 *
 * 用法：
 * ```ts
 * const client = createApiClient({
 *   baseUrl: "http://localhost:4000",
 *   getToken: () => localStorage.getItem("lynxkit_token"),
 * });
 * const user = await client.get("/v1/auth/me", UserSchema);
 * ```
 */
import type { ZodSchema } from "zod";

export interface ApiClientOptions {
  baseUrl: string;
  /** 返回当前 JWT，每次请求都会注入到 Authorization 头 */
  getToken?: () => string | null;
  /** 错误回调（抛出前触发，可用于全局 toast / 登出等） */
  onError?: (error: ApiError) => void;
  /** 可选的默认 headers（跨端注入自定义头） */
  defaultHeaders?: Record<string, string>;
}

/**
 * 统一 API 错误类型
 *
 * 所有非 2xx 响应（以及流式建立失败）都会被包装成 ApiError 抛出。
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** 错误响应体的常见结构 */
interface ErrorBody {
  code?: string;
  message?: string;
  details?: unknown;
  error?: { code?: string; message?: string; details?: unknown };
}

/**
 * 跨端 API 客户端
 */
export class ApiClient {
  constructor(private readonly opts: ApiClientOptions) {}

  async get<T>(path: string, schema?: ZodSchema<T>): Promise<T> {
    return this.request<T>("GET", path, undefined, schema);
  }

  async post<T>(
    path: string,
    body?: unknown,
    schema?: ZodSchema<T>,
  ): Promise<T> {
    return this.request<T>("POST", path, body, schema);
  }

  async put<T>(
    path: string,
    body?: unknown,
    schema?: ZodSchema<T>,
  ): Promise<T> {
    return this.request<T>("PUT", path, body, schema);
  }

  async delete<T>(path: string, schema?: ZodSchema<T>): Promise<T> {
    return this.request<T>("DELETE", path, undefined, schema);
  }

  /**
   * 统一请求入口
   */
  private async request<T>(
    method: string,
    path: string,
    body: unknown,
    schema?: ZodSchema<T>,
  ): Promise<T> {
    const url = `${this.opts.baseUrl}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...this.opts.defaultHeaders,
    };
    const token = this.opts.getToken?.();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const error = await this.buildError(res);
      this.opts.onError?.(error);
      throw error;
    }

    // 204 No Content
    if (res.status === 204) return undefined as T;

    const data = (await res.json()) as unknown;
    if (schema) return schema.parse(data);
    return data as T;
  }

  /**
   * 从响应构造 ApiError（兼容 { error: { code, message } } 与平铺 { code, message } 两种形态）
   */
  private async buildError(res: Response): Promise<ApiError> {
    let body: ErrorBody | null = null;
    try {
      body = (await res.json()) as ErrorBody;
    } catch {
      const text = await res.text().catch(() => "");
      return new ApiError(
        res.status,
        "UNKNOWN",
        text || res.statusText,
        text || undefined,
      );
    }

    const nested = body?.error;
    const code = nested?.code ?? body?.code ?? "UNKNOWN";
    const message =
      nested?.message ?? body?.message ?? res.statusText;
    return new ApiError(res.status, code, message, nested?.details ?? body?.details ?? body);
  }

  /**
   * SSE 流式接口（用于 Agent 流式响应）
   *
   * 以 POST + `text/event-stream` 建立连接，逐行解析 `data: ` 前缀的事件并 yield。
   *
   * ```ts
   * for await (const chunk of client.stream("/v1/build/123/stream", {})) {
   *   console.log(chunk);
   * }
   * ```
   */
  async *stream(path: string, body: unknown): AsyncGenerator<string> {
    const url = `${this.opts.baseUrl}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...this.opts.defaultHeaders,
    };
    const token = this.opts.getToken?.();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok || !res.body) {
      const error = await this.buildError(res);
      this.opts.onError?.(error);
      throw error;
    }

    yield* this.consumeSse(res);
  }

  /**
   * SSE 流式接口（GET 方式）
   *
   * 用于后端用 GET 建立 SSE 的场景（如 /agent/:sessionId/stream）。
   */
  async *getStream(path: string): AsyncGenerator<string> {
    const url = `${this.opts.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Accept: "text/event-stream",
      ...this.opts.defaultHeaders,
    };
    const token = this.opts.getToken?.();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, { method: "GET", headers });

    if (!res.ok || !res.body) {
      const error = await this.buildError(res);
      this.opts.onError?.(error);
      throw error;
    }

    yield* this.consumeSse(res);
  }

  private async *consumeSse(res: Response): AsyncGenerator<string> {
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          yield line.slice(6);
        }
      }
    }

    if (buffer.startsWith("data: ")) {
      yield buffer.slice(6);
    }
  }
}

/**
 * 创建 API 客户端实例
 */
export function createApiClient(opts: ApiClientOptions): ApiClient {
  return new ApiClient(opts);
}
