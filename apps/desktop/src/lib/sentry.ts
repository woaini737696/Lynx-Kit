/**
 * 客户端错误上报 - LynxKit Desktop
 *
 * 轻量级方案：不引入 @sentry/electron，而是通过 fetch 把错误发送到
 * API 的 /api/v1/telemetry/errors 端点，由 API 端的 @sentry/node 转发到 Sentry。
 *
 * 优势：
 *   - 零新增依赖（复用 API 已有的 @sentry/node）
 *   - DSN 驱动（API 端 SENTRY_DSN 未配置时自动降级为 no-op）
 *   - 适用于桌面端 + Web 端
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787/api/v1";

interface ErrorReport {
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  context?: Record<string, unknown>;
  timestamp?: string;
}

/**
 * 上报错误到 API 端点（fire-and-forget，不阻塞 UI）
 *
 * @param error 错误对象
 * @param context 附加上下文信息
 */
export function captureError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  const report: ErrorReport = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    url: window.location.href,
    userAgent: navigator.userAgent,
    context,
    timestamp: new Date().toISOString(),
  };

  // fire-and-forget — 上报失败不影响用户体验
  fetch(`${API_BASE_URL}/telemetry/errors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(report),
    keepalive: true,
  }).catch(() => {
    // silent fail
  });
}
