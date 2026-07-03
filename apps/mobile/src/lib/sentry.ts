/**
 * 客户端错误上报 - LynxKit Mobile
 *
 * 轻量级方案：通过 fetch 把错误发送到 API 的 /api/v1/telemetry/errors 端点，
 * 由 API 端的 @sentry/node 转发到 Sentry（DSN 驱动，未配置时 no-op）。
 */

interface ErrorReport {
  message: string;
  stack?: string;
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
    context,
    timestamp: new Date().toISOString(),
  };

  // fire-and-forget — 上报失败不影响用户体验
  fetch(`${process.env.EXPO_PUBLIC_API_URL || "http://localhost:8787"}/api/v1/telemetry/errors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(report),
    keepalive: true,
  }).catch(() => {
    // silent fail
  });
}
