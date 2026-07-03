/**
 * Web Vitals 性能指标采集
 *
 * 采集 LCP / CLS / INP / TTFB 四项核心指标（web-vitals v4 已移除 onFID，由 INP 取代），输出到 console。
 * main process 已注册 console-message 监听器（electron/main.ts），
 * 会自动将渲染进程 console 写入 renderer-debug.log，实现零侵入上报。
 *
 * 适用场景：
 * - 启动加载性能诊断（LCP/TTFB）
 * - 路由切换视觉稳定性（CLS）
 * - 交互响应度（INP）
 *
 * 注意：desktop 是 SPA，路由切换不触发完整页面加载，
 * 因此这些指标主要反映首屏加载与首次交互的质量。
 */

import { onLCP, onCLS, onINP, onTTFB, type Metric } from "web-vitals";

const LOG_PREFIX = "[web-vitals]";

function formatMetric(metric: Metric): string {
  const rating = metric.rating ? ` (${metric.rating})` : "";
  return `${LOG_PREFIX} ${metric.name}=${metric.value.toFixed(2)}${rating} id=${metric.id}`;
}

function report(metric: Metric): void {
  const line = formatMetric(metric);
  // 评级为 needs-improvement / poor 时用 warn 突出
  if (metric.rating === "needs-improvement" || metric.rating === "poor") {
    console.warn(line);
  } else {
    console.log(line);
  }
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
