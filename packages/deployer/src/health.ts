/**
 * 健康检查
 *
 * 部署后轮询访问入口，直到返回 200 OK 或超时。
 *
 * 策略：
 *   - 间隔 2s 轮询一次
 *   - 总超时 60s（30 次尝试）
 *   - 成功条件：HTTP 200 + 关键字段校验
 *   - 失败时返回最后一次错误日志（供 ⑥ 修复 Agent 使用）
 */

export interface HealthCheckOptions {
  /** 访问 URL（如 https://example.com 或 http://1.2.3.4:3000） */
  url: string;
  /** 期望状态码（默认 200） */
  expectedStatus?: number;
  /** 轮询间隔（毫秒），默认 2000 */
  intervalMs?: number;
  /** 总超时（毫秒），默认 60000 */
  timeoutMs?: number;
  /** 期望响应体包含的关键字（可选） */
  expectedBodyContains?: string;
}

export interface HealthCheckResult {
  /** 是否健康 */
  healthy: boolean;
  /** 最终状态码 */
  statusCode?: number;
  /** 轮询次数 */
  attempts: number;
  /** 总耗时（毫秒） */
  durationMs: number;
  /** 最后一次响应体片段 */
  lastBodySnippet?: string;
  /** 失败原因 */
  error?: string;
}

/**
 * 轮询健康检查
 *
 * TODO: Week 4 完整实现
 */
export async function pollHealth(
  options: HealthCheckOptions
): Promise<HealthCheckResult> {
  const intervalMs = options.intervalMs ?? 2000;
  const timeoutMs = options.timeoutMs ?? 60_000;
  const expectedStatus = options.expectedStatus ?? 200;
  const maxAttempts = Math.ceil(timeoutMs / intervalMs);

  // TODO: Week 4
  // for (let i = 0; i < maxAttempts; i++) {
  //   try {
  //     const res = await fetch(options.url, { signal: AbortSignal.timeout(5000) });
  //     if (res.status === expectedStatus) {
  //       const body = await res.text();
  //       if (!options.expectedBodyContains || body.includes(options.expectedBodyContains)) {
  //         return { healthy: true, statusCode: res.status, attempts: i + 1, ... };
  //       }
  //     }
  //   } catch (err) { ... }
  //   await sleep(intervalMs);
  // }
  void options;
  void expectedStatus;
  void maxAttempts;

  return {
    healthy: false,
    attempts: 0,
    durationMs: 0,
    error: "[Week 1 占位] 健康检查未实际执行",
  };
}

/**
 * 单次 ping 检查（不轮询）
 *
 * TODO: Week 4 完整实现
 */
export async function pingOnce(
  url: string,
  timeoutMs = 5000
): Promise<{ ok: boolean; statusCode?: number; latencyMs: number }> {
  void url;
  void timeoutMs;
  // TODO: Week 4 - fetch + 计时
  return { ok: false, latencyMs: 0 };
}
