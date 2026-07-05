"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface Stats {
  totals: {
    users: number;
    builds: number;
    products: number;
    transactions: number;
    creators: number;
  };
  recent: {
    users: Array<{ id: string; phone: string; name: string; role: string; status: string; createdAt: string }>;
    builds: Array<{ id: string; status: string; productType: string; createdAt: string }>;
  };
}

const statCards = [
  { key: "users", label: "总用户数", icon: "👥" },
  { key: "builds", label: "构建会话", icon: "📦" },
  { key: "products", label: "商店产品", icon: "🛍️" },
  { key: "transactions", label: "交易记录", icon: "💳" },
  { key: "creators", label: "创作者", icon: "🎨" },
] as const;

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi
      .getStats()
      .then((data) => setStats(data as Stats))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-ink-400">加载中...</div>;
  }

  if (error) {
    return <div className="rounded-lg bg-red-50 p-4 text-red-600">{error}</div>;
  }

  if (!stats) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-950">数据看板</h1>
        <p className="mt-1 text-sm text-ink-500">平台运营数据总览</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {statCards.map((card) => (
          <div key={card.key} className="glass-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-lg">{card.icon}</span>
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-ink-950">
              {(stats.totals as Record<string, number>)[card.key] ?? 0}
            </p>
            <p className="mt-1 text-xs text-ink-500">{card.label}</p>
          </div>
        ))}
      </div>

      {/* 最近用户 + 构建会话 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 最近注册用户 */}
        <div className="glass-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink-950">最近注册用户</h2>
          <div className="space-y-2">
            {stats.recent.users.length === 0 ? (
              <p className="text-sm text-ink-400">暂无数据</p>
            ) : (
              stats.recent.users.map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-ink-50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-100 text-xs font-medium text-ink-700">
                      {u.name?.[0] ?? "U"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink-950">{u.name ?? "未命名"}</p>
                      <p className="text-xs text-ink-400">{u.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="badge-ink">{u.role}</span>
                    <p className="mt-1 text-xs text-ink-400">{formatDate(u.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 最近构建会话 */}
        <div className="glass-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink-950">最近构建会话</h2>
          <div className="space-y-2">
            {stats.recent.builds.length === 0 ? (
              <p className="text-sm text-ink-400">暂无数据</p>
            ) : (
              stats.recent.builds.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-ink-50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-100 text-ink-600">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink-950">{b.productType}</p>
                      <p className="text-xs text-ink-400">{b.id.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="badge-ink">{b.status}</span>
                    <p className="mt-1 text-xs text-ink-400">{formatDate(b.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
