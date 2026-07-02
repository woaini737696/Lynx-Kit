/**
 * GET /api/health
 *
 * Web 应用自身健康检查 + 后端 API 连通性探测。
 * 返回 { status, timestamp, version, services }。
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 直接读取环境变量，避免在 Route Handler 中引入客户端 api-client / store / toast
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0";

interface ServiceStatus {
  status: "ok" | "fail";
  latencyMs?: number;
  detail?: string;
}

interface HealthResponse {
  status: "ok" | "degraded";
  timestamp: number;
  version: string;
  services: {
    api: ServiceStatus;
  };
}

async function probeApi(): Promise<ServiceStatus> {
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const latencyMs = Date.now() - started;

    if (!res.ok) {
      return { status: "fail", latencyMs, detail: `HTTP ${res.status}` };
    }
    return { status: "ok", latencyMs };
  } catch (err) {
    const latencyMs = Date.now() - started;
    return {
      status: "fail",
      latencyMs,
      detail: err instanceof Error ? err.message : "不可达",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(): Promise<Response> {
  const api = await probeApi();
  const status: HealthResponse["status"] =
    api.status === "ok" ? "ok" : "degraded";

  const body: HealthResponse = {
    status,
    timestamp: Date.now(),
    version: APP_VERSION,
    services: { api },
  };

  // 后端不可达时仍返回 200，仅标记 degraded，便于探活而非告警风暴
  return Response.json(body, { status: 200 });
}
