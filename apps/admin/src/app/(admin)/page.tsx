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

interface Dashboard {
  membership: {
    distribution: Array<{ tier: string; activeCount: number }>;
  };
  scoin: {
    totalBalance: number;
    totalFrozen: number;
    totalGranted: number;
    totalConsumed: number;
  };
  revenue: {
    totalAmount: string;
    totalPlatformFee: string;
    totalSellerRevenue: string;
    completedCount: number;
  };
  builds: {
    statusDistribution: Array<{ status: string; count: number }>;
  };
  products: {
    statusDistribution: Array<{ status: string; count: number }>;
  };
  trends: {
    last7days: {
      users: Array<{ date: string; count: number }>;
      builds: Array<{ date: string; count: number }>;
    };
  };
}

const statCards = [
  { key: "users", label: "总用户数", icon: "👥" },
  { key: "builds", label: "构建会话", icon: "📦" },
  { key: "products", label: "商店产品", icon: "🛍️" },
  { key: "transactions", label: "交易记录", icon: "💳" },
  { key: "creators", label: "创作者", icon: "🎨" },
] as const;

const tierColors: Record<string, string> = {
  FREE: "bg-ink-100 text-ink-700",
  LITE: "bg-blue-100 text-blue-700",
  PRO: "bg-purple-100 text-purple-700",
  MAX: "bg-amber-100 text-amber-700",
};

const statusColors: Record<string, string> = {
  DEPLOYED: "bg-green-100 text-green-700",
  BUILDING: "bg-blue-100 text-blue-700",
  ERROR: "bg-red-100 text-red-700",
  PENDING: "bg-ink-100 text-ink-700",
  PUBLISHED: "bg-green-100 text-green-700",
  DRAFT: "bg-ink-100 text-ink-700",
  PENDING_REVIEW: "bg-amber-100 text-amber-700",
};

function formatCurrency(amount: string): string {
  const num = Number(amount);
  if (!num) return "¥0";
  return `¥${num.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([adminApi.getStats(), adminApi.getDashboard()])
      .then(([s, d]) => {
        setStats(s as Stats);
        setDashboard(d as Dashboard);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-ink-400">加载中...</div>;
  }

  if (error) {
    return <div className="rounded-lg bg-red-50 p-4 text-red-600">{error}</div>;
  }

  if (!stats || !dashboard) return null;

  const totalMembership = dashboard.membership.distribution.reduce((sum, m) => sum + m.activeCount, 0);
  const maxTrend = Math.max(
    1,
    ...dashboard.trends.last7days.users.map((u) => u.count),
    ...dashboard.trends.last7days.builds.map((b) => b.count),
  );

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

      {/* 业务指标 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 会员分布 */}
        <div className="glass-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink-950">会员分布</h2>
          <div className="space-y-3">
            {dashboard.membership.distribution.length === 0 ? (
              <p className="text-sm text-ink-400">暂无数据</p>
            ) : (
              dashboard.membership.distribution
                .sort((a, b) => b.activeCount - a.activeCount)
                .map((m) => (
                  <div key={m.tier} className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tierColors[m.tier] ?? "bg-ink-100 text-ink-700"}`}
                    >
                      {m.tier}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-ink-100">
                        <div
                          className="h-full rounded-full bg-ink-900"
                          style={{ width: `${totalMembership > 0 ? (m.activeCount / totalMembership) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-ink-950">{m.activeCount}</span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* S 币统计 */}
        <div className="glass-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink-950">S 币统计</h2>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg bg-ink-50 p-3">
              <p className="text-ink-500">可用余额</p>
              <p className="mt-1 text-base font-semibold text-ink-950">{dashboard.scoin.totalBalance.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-ink-50 p-3">
              <p className="text-ink-500">冻结余额</p>
              <p className="mt-1 text-base font-semibold text-ink-950">{dashboard.scoin.totalFrozen.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-ink-50 p-3">
              <p className="text-ink-500">累计赠送</p>
              <p className="mt-1 text-base font-semibold text-ink-950">{dashboard.scoin.totalGranted.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-ink-50 p-3">
              <p className="text-ink-500">累计消耗</p>
              <p className="mt-1 text-base font-semibold text-ink-950">{dashboard.scoin.totalConsumed.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* 收入统计 */}
        <div className="glass-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink-950">收入统计</h2>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-ink-500">交易总额</span>
              <span className="text-base font-semibold text-ink-950">{formatCurrency(dashboard.revenue.totalAmount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-500">平台抽成</span>
              <span className="text-base font-semibold text-ink-950">{formatCurrency(dashboard.revenue.totalPlatformFee)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-500">创作者收益</span>
              <span className="text-base font-semibold text-ink-950">{formatCurrency(dashboard.revenue.totalSellerRevenue)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-ink-100 pt-3">
              <span className="text-ink-500">已完成交易</span>
              <span className="text-base font-semibold text-ink-950">{dashboard.revenue.completedCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 7 天趋势 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink-950">最近 7 天用户注册趋势</h2>
          {dashboard.trends.last7days.users.length === 0 ? (
            <p className="text-sm text-ink-400">暂无数据</p>
          ) : (
            <div className="flex h-40 items-end gap-2">
              {dashboard.trends.last7days.users.map((u) => (
                <div key={u.date} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs font-medium text-ink-950">{u.count}</span>
                  <div
                    className="w-full rounded-t bg-ink-900"
                    style={{ height: `${(u.count / maxTrend) * 100}%`, minHeight: "4px" }}
                  />
                  <span className="text-xs text-ink-400">{u.date.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink-950">最近 7 天构建会话趋势</h2>
          {dashboard.trends.last7days.builds.length === 0 ? (
            <p className="text-sm text-ink-400">暂无数据</p>
          ) : (
            <div className="flex h-40 items-end gap-2">
              {dashboard.trends.last7days.builds.map((b) => (
                <div key={b.date} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs font-medium text-ink-950">{b.count}</span>
                  <div
                    className="w-full rounded-t bg-ink-900"
                    style={{ height: `${(b.count / maxTrend) * 100}%`, minHeight: "4px" }}
                  />
                  <span className="text-xs text-ink-400">{b.date.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 状态分布 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink-950">构建状态分布</h2>
          <div className="flex flex-wrap gap-2">
            {dashboard.builds.statusDistribution.length === 0 ? (
              <p className="text-sm text-ink-400">暂无数据</p>
            ) : (
              dashboard.builds.statusDistribution.map((b) => (
                <div
                  key={b.status}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${statusColors[b.status] ?? "bg-ink-100 text-ink-700"}`}
                >
                  <span>{b.status}</span>
                  <span className="font-semibold">{b.count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink-950">产品状态分布</h2>
          <div className="flex flex-wrap gap-2">
            {dashboard.products.statusDistribution.length === 0 ? (
              <p className="text-sm text-ink-400">暂无数据</p>
            ) : (
              dashboard.products.statusDistribution.map((p) => (
                <div
                  key={p.status}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${statusColors[p.status] ?? "bg-ink-100 text-ink-700"}`}
                >
                  <span>{p.status}</span>
                  <span className="font-semibold">{p.count}</span>
                </div>
              ))
            )}
          </div>
        </div>
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
