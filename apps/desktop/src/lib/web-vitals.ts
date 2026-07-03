/**
 * Web Vitals 性能指标采集
 *
 * 采集 LCP / CLS / INP / TTFB 四项核心指标（web-vitals v4 已移除 onFID，由 INP 取代），
 * 同时上报到 API 端 /api/v1/telemetry/vitals（由 API 转发到 Sentry，仅 poor 评级触发告警）。
 *
 * 本地仍输出到 console，供 main process 的 console-message 监听器写入 renderer-debug.log。
 *
 * 适用场景：
 * - 启动加载性能诊断（LCP/TTFB）
 * - 路由切换视觉稳定性（CLS）
 * - 交互响应度（INP）
 */

import { onLCP, onCLS, onINP, onTTFB, type Metric } from "web-vitals";

const LOG_PREFIX = "[web-vitals]";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787/api/v1";

/** 累积指标，批量上报到 API */
const pendingMetrics: Metric[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function formatMetric(metric: Metric): string {
  const rating = metric.rating ? ` (${metric.rating})` : "";
  return `${LOG_PREFIX} ${metric.name}=${metric.value.toFixed(2)}${rating} id=${metric.id}`;
}

function reportToApi(metrics: Metric[]): void {
  if (metrics.length === 0) return;
  fetch(`${API_BASE_URL}/telemetry/vitals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      metrics: metrics.map((m) => ({
        name: m.name,
        value: m.value,
        rating: m.rating,
        id: m.id,
        navigationType: m.navigationType,
      })),
      url: window.location.href,
      userAgent: navigator.userAgent,
    }),
    keepalive: true,
  }).catch(() => {
    // silent fail
  });
}

function report(metric: Metric): void {
  // 1. 本地 console 输出（main process 会捕获写入 log）
  const line = formatMetric(metric);
  if (metric.rating === "needs-improvement" || metric.rating === "poor") {
    console.warn(line);
  } else {
    console.log(line);
  }

  // 2. 累积到批量队列，延迟 2s 上报（减少请求数）
  pendingMetrics.push(metric);
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    reportToApi(pendingMetrics.splice(0));
    flushTimer = null;
  }, 2000);
}

let initialized = false;

/**
 * 启动 Web Vitals 采集
 *
 * 应在应用启动早期调用一次（providers.tsx），避免重复注册。
 */
export function initWebVitals(): void {
  if (initialized) return;
  initialized = true;

  try {
    onLCP(report);
    onCLS(report);
    onINP(report);
    onTTFB(report);
  } catch (err) {
    console.warn(`${LOG_PREFIX} 初始化失败：`, err);
  }
}
