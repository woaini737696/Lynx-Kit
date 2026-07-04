"use client";

import * as React from "react";
import {
  Server,
  Database,
  Cpu,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { Skeleton } from "@lynxkit/ui-web";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api";

/**
 * 系统监控 - iOS26 极简黑白灰毛玻璃风格
 *
 * - 探测后端 /api/v1/system/health 获取 DB / Redis 实时状态
 * - 探测 /api/v1/system/ai-providers 获取 AI Provider 配置情况
 * - API 响应时间 / 错误率为占位 mock（后端暂无 metrics 端点）
 */

interface BackendHealth {
  status: string;
  timestamp: number;
  checks?: Record<string, "ok" | "fail">;
}

interface AiProvider {
  id: string;
  name: string;
  configured: boolean;
}

const RESPONSE_TIME_POINTS = [180, 165, 172, 158, 142, 138, 145, 151, 134, 128, 140, 142];
const ERROR_RATE_POINTS = [0.4, 0.3, 0.5, 0.3, 0.3, 0.2, 0.3, 0.4, 0.3, 0.2, 0.3, 0.3];

export default function AdminMonitoringPage() {
  const [health, setHealth] = React.useState<BackendHealth | null>(null);
  const [providers, setProviders] = React.useState<AiProvider[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const [healthRes, providersRes] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/api/v1/system/health`, {
          signal: controller.signal,
        }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))) as Promise<BackendHealth>,
        fetch(`${API_BASE_URL}/api/v1/system/ai-providers`, {
          signal: controller.signal,
        }).then((r) =>
          r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)),
        ) as Promise<{ providers: AiProvider[] }>,
      ]);

      if (healthRes.status === "fulfilled") {
        setHealth(healthRes.value);
      } else {
        setError(
          healthRes.reason instanceof Error
            ? healthRes.reason.message
            : "后端连接失败",
        );
      }
      if (providersRes.status === "fulfilled") {
        setProviders(providersRes.value.providers ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "后端不可达");
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const dbOk = health?.checks?.database === "ok";
  const redisOk = health?.checks?.redis === "ok";
  const overallOk = health?.status === "ok";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-[-0.02em] text-ink-950 dark:text-ink-50">
            系统监控
          </h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            实时观测后端服务、数据库、缓存与 AI Provider 状态
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchData()}
          disabled={loading}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-ink-200/60 bg-white/55 px-4 text-sm font-medium text-ink-700 backdrop-blur-xl transition-all hover:bg-white/72 hover:text-ink-950 disabled:opacity-50 dark:border-ink-700/60 dark:bg-white/5 dark:text-ink-200 dark:hover:bg-white/10 dark:hover:text-ink-50"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          刷新
        </button>
      </div>

      {/* 后端总状态 - 玻璃卡片 */}
      <div className="glow-card flex items-center gap-4 p-6">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl",
            loading
              ? "bg-ink-100 text-ink-400 dark:bg-ink-800 dark:text-ink-500"
              : overallOk
                ? "bg-ink-950 text-white dark:bg-ink-100 dark:text-ink-950"
                : "bg-ink-300 text-ink-700 dark:bg-ink-700 dark:text-ink-200",
          )}
        >
          <Server className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.06em] text-ink-500 dark:text-ink-400">
            后端服务
          </p>
          {loading ? (
            <Skeleton className="mt-1 h-6 w-32" />
          ) : (
            <p className="text-xl font-bold tracking-[-0.02em] text-ink-950 dark:text-ink-50">
              {overallOk ? "运行正常" : health?.status === "degraded" ? "降级运行" : "连接异常"}
            </p>
          )}
          <p className="text-[11px] text-ink-500 dark:text-ink-400">
            {API_BASE_URL}
            {health?.timestamp
              ? ` · 更新于 ${new Date(health.timestamp).toLocaleTimeString()}`
              : ""}
          </p>
        </div>
        {error ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-950 px-3 py-1 text-xs font-medium text-white dark:bg-ink-100 dark:text-ink-950">
            <AlertTriangle className="h-3.5 w-3.5" />
            {error}
          </span>
        ) : null}
      </div>

      {/* 基础设施状态 - 玻璃卡片 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfraCard
          label="数据库"
          icon={Database}
          loading={loading}
          ok={dbOk}
          okText="已连接"
          failText={health ? "连接失败" : "未知"}
        />
        <InfraCard
          label="Redis"
          icon={Activity}
          loading={loading}
          ok={redisOk}
          okText="已连接"
          failText={health ? "连接失败" : "未知"}
        />
        <InfraCard
          label="API 响应时间"
          icon={Activity}
          loading={false}
          ok={true}
          okText="142 ms"
          okHint="P95 · 最近 5 分钟"
          failText="无数据"
        />
        <InfraCard
          label="错误率"
          icon={AlertTriangle}
          loading={false}
          ok={true}
          okText="0.3%"
          okHint="最近 1 小时"
          failText="无数据"
        />
      </div>

      {/* 图表 - 玻璃卡片 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          title="API 响应时间（ms）"
          subtitle="最近 12 个采样点"
          points={RESPONSE_TIME_POINTS}
          unit="ms"
          colorClass="bg-ink-950 dark:bg-ink-100"
        />
        <ChartCard
          title="错误率（%）"
          subtitle="最近 12 个采样点"
          points={ERROR_RATE_POINTS}
          unit="%"
          colorClass="bg-ink-400 dark:bg-ink-500"
        />
      </div>

      {/* AI Provider 状态 - 玻璃卡片 */}
      <div className="glow-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-950 text-white dark:bg-ink-100 dark:text-ink-950">
            <Cpu className="h-4 w-4" />
          </div>
          <h2 className="text-base font-semibold tracking-[-0.01em] text-ink-950 dark:text-ink-50">
            AI Provider 状态
          </h2>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : providers.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-2xl border border-ink-200/60 bg-white/55 px-4 py-3 backdrop-blur-xl dark:border-ink-800/60 dark:bg-white/5"
              >
                <div className="flex items-center gap-2">
                  {p.configured ? (
                    <CheckCircle2 className="h-4 w-4 text-ink-950 dark:text-ink-50" />
                  ) : (
                    <XCircle className="h-4 w-4 text-ink-400 dark:text-ink-500" />
                  )}
                  <span className="text-sm font-medium text-ink-900 dark:text-ink-50">{p.name}</span>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    p.configured
                      ? "bg-ink-950 text-white dark:bg-ink-100 dark:text-ink-950"
                      : "border border-ink-200 text-ink-500 dark:border-ink-700 dark:text-ink-400",
                  )}
                >
                  {p.configured ? "已配置" : "未配置"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-ink-500 dark:text-ink-400">
            未能获取 AI Provider 列表
          </p>
        )}
      </div>
    </div>
  );
}

interface InfraCardProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  loading: boolean;
  ok: boolean;
  okText: string;
  failText: string;
  okHint?: string;
}

function InfraCard({
  label,
  icon: Icon,
  loading,
  ok,
  okText,
  failText,
  okHint,
}: InfraCardProps) {
  return (
    <div className="glow-card flex items-center gap-4 p-5">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl",
          loading
            ? "bg-ink-100 text-ink-400 dark:bg-ink-800 dark:text-ink-500"
            : ok
              ? "bg-ink-950 text-white dark:bg-ink-100 dark:text-ink-950"
              : "bg-ink-300 text-ink-700 dark:bg-ink-700 dark:text-ink-200",
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.06em] text-ink-500 dark:text-ink-400">
          {label}
        </p>
        {loading ? (
          <Skeleton className="mt-1 h-5 w-20" />
        ) : (
          <p
            className={cn(
              "text-base font-semibold",
              ok
                ? "text-ink-950 dark:text-ink-50"
                : "text-ink-500 dark:text-ink-400",
            )}
          >
            {ok ? okText : failText}
          </p>
        )}
        {ok && okHint && !loading ? (
          <p className="text-[11px] text-ink-500 dark:text-ink-400">{okHint}</p>
        ) : null}
      </div>
    </div>
  );
}

interface ChartCardProps {
  title: string;
  subtitle: string;
  points: number[];
  unit: string;
  colorClass: string;
}

function ChartCard({ title, subtitle, points, unit, colorClass }: ChartCardProps) {
  const max = Math.max(...points, 1);
  const avg = (points.reduce((a, b) => a + b, 0) / points.length).toFixed(1);

  return (
    <div className="glow-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-[-0.01em] text-ink-950 dark:text-ink-50">
            {title}
          </h3>
          <p className="text-xs text-ink-500 dark:text-ink-400">{subtitle}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-ink-950 dark:text-ink-50">{avg}</p>
          <p className="text-[11px] text-ink-500 dark:text-ink-400">均值 {unit}</p>
        </div>
      </div>
      <div className="flex h-40 items-end gap-1.5">
        {points.map((v, i) => (
          <div
            key={i}
            className={cn("flex-1 rounded-t transition-all", colorClass)}
            style={{ height: `${Math.max((v / max) * 100, 4)}%` }}
            title={`${v}${unit}`}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-ink-500 dark:text-ink-400">
        <span>12 点前</span>
        <span>当前</span>
      </div>
    </div>
  );
}
