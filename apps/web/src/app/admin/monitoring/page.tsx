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
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@lynxkit/ui-web";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api";

/**
 * 系统监控
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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">系统监控</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            实时观测后端服务、数据库、缓存与 AI Provider 状态
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void fetchData()}
          disabled={loading}
          className="h-9 gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          刷新
        </Button>
      </div>

      {/* 后端总状态 */}
      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl",
              loading
                ? "bg-muted text-muted-foreground"
                : overallOk
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-red-500/10 text-red-600 dark:text-red-400",
            )}
          >
            <Server className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">后端服务</p>
            {loading ? (
              <Skeleton className="mt-1 h-6 w-32" />
            ) : (
              <p className="text-lg font-bold tracking-tight">
                {overallOk ? "运行正常" : health?.status === "degraded" ? "降级运行" : "连接异常"}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">
              {API_BASE_URL}
              {health?.timestamp
                ? ` · 更新于 ${new Date(health.timestamp).toLocaleTimeString()}`
                : ""}
            </p>
          </div>
          {error ? (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              {error}
            </Badge>
          ) : null}
        </CardContent>
      </Card>

      {/* 基础设施状态 */}
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

      {/* 图表 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          title="API 响应时间（ms）"
          subtitle="最近 12 个采样点"
          points={RESPONSE_TIME_POINTS}
          unit="ms"
          colorClass="bg-lynx-500/70"
        />
        <ChartCard
          title="错误率（%）"
          subtitle="最近 12 个采样点"
          points={ERROR_RATE_POINTS}
          unit="%"
          colorClass="bg-amber-500/70"
        />
      </div>

      {/* AI Provider 状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Cpu className="h-4 w-4 text-lynx-600 dark:text-lynx-400" />
            AI Provider 状态
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    {p.configured ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">{p.name}</span>
                  </div>
                  <Badge variant={p.configured ? "default" : "outline"}>
                    {p.configured ? "已配置" : "未配置"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              未能获取 AI Provider 列表
            </p>
          )}
        </CardContent>
      </Card>
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
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            loading
              ? "bg-muted text-muted-foreground"
              : ok
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/10 text-red-600 dark:text-red-400",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-1 h-5 w-20" />
          ) : (
            <p
              className={cn(
                "text-base font-semibold",
                ok
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400",
              )}
            >
              {ok ? okText : failText}
            </p>
          )}
          {ok && okHint && !loading ? (
            <p className="text-[11px] text-muted-foreground">{okHint}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold">{avg}</p>
          <p className="text-[11px] text-muted-foreground">均值 {unit}</p>
        </div>
      </CardHeader>
      <CardContent>
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
        <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
          <span>12 点前</span>
          <span>当前</span>
        </div>
      </CardContent>
    </Card>
  );
}
