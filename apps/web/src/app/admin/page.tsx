"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users as UsersIcon,
  Package,
  Banknote,
  Hammer,
  Activity,
  AlertTriangle,
  Server,
  ChevronRight,
} from "lucide-react";
import { StatsCard } from "@/components/admin/stats-card";
import {
  DataTable,
  type Column,
} from "@/components/admin/data-table";
import {
  cn,
  formatDateTime,
  formatPrice,
  formatCompactNumber,
} from "@/lib/utils";

/**
 * 仪表盘 - iOS26 极简黑白灰毛玻璃风格
 *
 * 在接入管理员 API 之前，下列数据为占位 mock（与 store/data.ts 风格一致）。
 * 后续切换为 adminApi.stats() 返回。
 */

interface RecentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "suspended";
  createdAt: string;
}

interface RecentOrder {
  id: string;
  product: string;
  buyer: string;
  amount: number; // 分
  status: "pending" | "completed" | "refunded";
  createdAt: string;
}

const RECENT_USERS: RecentUser[] = [
  {
    id: "u-1024",
    name: "陈思远",
    email: "chen@example.com",
    role: "创作者",
    status: "active",
    createdAt: "2026-07-02T09:12:00Z",
  },
  {
    id: "u-1023",
    name: "Linda Wang",
    email: "linda@example.com",
    role: "用户",
    status: "active",
    createdAt: "2026-07-02T08:34:00Z",
  },
  {
    id: "u-1022",
    name: "张明",
    email: "zhang@example.com",
    role: "创作者",
    status: "active",
    createdAt: "2026-07-01T22:05:00Z",
  },
  {
    id: "u-1021",
    name: "Alex Chen",
    email: "alex@example.com",
    role: "用户",
    status: "suspended",
    createdAt: "2026-07-01T18:47:00Z",
  },
  {
    id: "u-1020",
    name: "王芳",
    email: "wang@example.com",
    role: "用户",
    status: "active",
    createdAt: "2026-07-01T14:21:00Z",
  },
];

const RECENT_ORDERS: RecentOrder[] = [
  {
    id: "tx-2048",
    product: "AI 陪伴聊天",
    buyer: "周杰",
    amount: 9900,
    status: "completed",
    createdAt: "2026-07-02T09:30:00Z",
  },
  {
    id: "tx-2047",
    product: "智能 BI 报表",
    buyer: "Linda Wang",
    amount: 29900,
    status: "completed",
    createdAt: "2026-07-02T08:11:00Z",
  },
  {
    id: "tx-2046",
    product: "轻量 CRM",
    buyer: "陈思远",
    amount: 19900,
    status: "pending",
    createdAt: "2026-07-01T23:50:00Z",
  },
  {
    id: "tx-2045",
    product: "AI 知识库",
    buyer: "Sophie",
    amount: 9900,
    status: "refunded",
    createdAt: "2026-07-01T17:02:00Z",
  },
];

const ORDER_STATUS: Record<
  RecentOrder["status"],
  { label: string; tone: "ink" | "muted" | "outline" }
> = {
  pending: { label: "待支付", tone: "muted" },
  completed: { label: "已完成", tone: "ink" },
  refunded: { label: "已退款", tone: "outline" },
};

function OrderBadge({ status }: { status: RecentOrder["status"] }) {
  const cfg = ORDER_STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        cfg.tone === "ink"
          ? "bg-ink-950 text-white dark:bg-ink-100 dark:text-ink-950"
          : cfg.tone === "muted"
            ? "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300"
            : "border border-ink-200 text-ink-500 dark:border-ink-700 dark:text-ink-400",
      )}
    >
      {cfg.label}
    </span>
  );
}

const userColumns: Column<RecentUser>[] = [
  {
    key: "name",
    header: "用户",
    cell: (u) => (
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-950 text-xs font-semibold text-white dark:bg-ink-100 dark:text-ink-950">
          {u.name.slice(0, 1)}
        </span>
        <div>
          <p className="font-medium text-ink-900 dark:text-ink-50">{u.name}</p>
          <p className="text-xs text-ink-500 dark:text-ink-400">{u.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: "role",
    header: "角色",
    cell: (u) => (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
          u.role === "创作者"
            ? "bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200"
            : "text-ink-500 dark:text-ink-400",
        )}
      >
        {u.role}
      </span>
    ),
  },
  {
    key: "status",
    header: "状态",
    cell: (u) =>
      u.status === "active" ? (
        <span className="inline-flex items-center gap-1.5 text-ink-700 dark:text-ink-200">
          <span className="h-1.5 w-1.5 rounded-full bg-ink-950 dark:bg-ink-100" />
          正常
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-ink-500 dark:text-ink-400">
          <span className="h-1.5 w-1.5 rounded-full bg-ink-300 dark:bg-ink-700" />
          封禁
        </span>
      ),
  },
  {
    key: "createdAt",
    header: "注册时间",
    sortable: true,
    sortValue: (u) => u.createdAt,
    cell: (u) => (
      <span className="text-ink-500 dark:text-ink-400">
        {formatDateTime(u.createdAt)}
      </span>
    ),
  },
];

const orderColumns: Column<RecentOrder>[] = [
  {
    key: "id",
    header: "订单号",
    cell: (o) => <span className="font-mono text-xs text-ink-700 dark:text-ink-200">{o.id}</span>,
  },
  {
    key: "product",
    header: "商品",
    cell: (o) => <span className="font-medium text-ink-900 dark:text-ink-50">{o.product}</span>,
  },
  {
    key: "buyer",
    header: "买家",
    cell: (o) => <span className="text-ink-500 dark:text-ink-400">{o.buyer}</span>,
  },
  {
    key: "amount",
    header: "金额",
    sortable: true,
    sortValue: (o) => o.amount,
    cell: (o) => (
      <span className="font-semibold text-ink-950 dark:text-ink-50">
        {formatPrice(o.amount)}
      </span>
    ),
  },
  {
    key: "status",
    header: "状态",
    cell: (o) => <OrderBadge status={o.status} />,
  },
  {
    key: "createdAt",
    header: "时间",
    sortable: true,
    sortValue: (o) => o.createdAt,
    cell: (o) => (
      <span className="text-ink-500 dark:text-ink-400">
        {formatDateTime(o.createdAt)}
      </span>
    ),
  },
];

interface HealthItem {
  label: string;
  value: string;
  hint: string;
  ok: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

export default function AdminDashboardPage() {
  const health: HealthItem[] = [
    {
      label: "API 响应时间",
      value: "142 ms",
      hint: "P95 · 最近 5 分钟",
      ok: true,
      icon: Activity,
    },
    {
      label: "错误率",
      value: "0.3%",
      hint: "最近 1 小时",
      ok: true,
      icon: AlertTriangle,
    },
    {
      label: "在线用户",
      value: "247",
      hint: "实时连接",
      ok: true,
      icon: Server,
    },
  ];

  return (
    <div className="space-y-8">
      {/* 页头 */}
      <div>
        <h1 className="text-3xl font-bold tracking-[-0.02em] text-ink-950 dark:text-ink-50">
          仪表盘
        </h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          平台整体运行状况与关键指标概览
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="用户总数"
          value={formatCompactNumber(12856)}
          change={12.5}
          icon={UsersIcon}
        />
        <StatsCard
          title="商品总数"
          value={formatCompactNumber(348)}
          change={8.2}
          icon={Package}
        />
        <StatsCard
          title="交易额"
          value={formatPrice(128640000)}
          change={23.1}
          icon={Banknote}
        />
        <StatsCard
          title="构建次数"
          value={formatCompactNumber(5672)}
          change={15.7}
          icon={Hammer}
        />
      </div>

      {/* 系统健康 - 玻璃卡片 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {health.map((h) => {
          const Icon = h.icon;
          return (
            <div
              key={h.label}
              className="glow-card flex items-center gap-4 p-5"
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  h.ok
                    ? "bg-ink-950 text-white dark:bg-ink-100 dark:text-ink-950"
                    : "bg-ink-200 text-ink-600 dark:bg-ink-800 dark:text-ink-300",
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.06em] text-ink-500 dark:text-ink-400">
                  {h.label}
                </p>
                <p className="text-xl font-bold tracking-[-0.02em] text-ink-950 dark:text-ink-50">
                  {h.value}
                </p>
                <p className="text-[11px] text-ink-500 dark:text-ink-400">{h.hint}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 最近注册用户 + 最近交易 - 玻璃容器 */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="glow-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-[-0.01em] text-ink-950 dark:text-ink-50">
              最近注册用户
            </h2>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-0.5 text-xs font-medium text-ink-950 transition-colors hover:text-ink-700 dark:text-ink-50 dark:hover:text-ink-200"
            >
              查看全部
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <DataTable
            columns={userColumns}
            data={RECENT_USERS}
            rowKey={(u) => u.id}
          />
        </section>

        <section className="glow-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-[-0.01em] text-ink-950 dark:text-ink-50">
              最近交易
            </h2>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-0.5 text-xs font-medium text-ink-950 transition-colors hover:text-ink-700 dark:text-ink-50 dark:hover:text-ink-200"
            >
              查看全部
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <DataTable
            columns={orderColumns}
            data={RECENT_ORDERS}
            rowKey={(o) => o.id}
          />
        </section>
      </div>
    </div>
  );
}
