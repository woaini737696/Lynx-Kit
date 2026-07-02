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
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@lynxkit/ui-web";
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
 * 仪表盘
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

const ROLE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  创作者: "default",
  用户: "secondary",
};

const ORDER_STATUS: Record<
  RecentOrder["status"],
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  pending: { label: "待支付", variant: "secondary" },
  completed: { label: "已完成", variant: "default" },
  refunded: { label: "已退款", variant: "outline" },
};

const userColumns: Column<RecentUser>[] = [
  {
    key: "name",
    header: "用户",
    cell: (u) => (
      <div>
        <p className="font-medium">{u.name}</p>
        <p className="text-xs text-muted-foreground">{u.email}</p>
      </div>
    ),
  },
  {
    key: "role",
    header: "角色",
    cell: (u) => (
      <Badge variant={ROLE_VARIANT[u.role] ?? "secondary"}>{u.role}</Badge>
    ),
  },
  {
    key: "status",
    header: "状态",
    cell: (u) =>
      u.status === "active" ? (
        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          正常
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
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
      <span className="text-muted-foreground">{formatDateTime(u.createdAt)}</span>
    ),
  },
];

const orderColumns: Column<RecentOrder>[] = [
  {
    key: "id",
    header: "订单号",
    cell: (o) => <span className="font-mono text-xs">{o.id}</span>,
  },
  {
    key: "product",
    header: "商品",
    cell: (o) => <span className="font-medium">{o.product}</span>,
  },
  {
    key: "buyer",
    header: "买家",
    cell: (o) => <span className="text-muted-foreground">{o.buyer}</span>,
  },
  {
    key: "amount",
    header: "金额",
    sortable: true,
    sortValue: (o) => o.amount,
    cell: (o) => (
      <span className="font-medium text-lynx-600 dark:text-lynx-400">
        {formatPrice(o.amount)}
      </span>
    ),
  },
  {
    key: "status",
    header: "状态",
    cell: (o) => (
      <Badge variant={ORDER_STATUS[o.status].variant}>
        {ORDER_STATUS[o.status].label}
      </Badge>
    ),
  },
  {
    key: "createdAt",
    header: "时间",
    sortable: true,
    sortValue: (o) => o.createdAt,
    cell: (o) => (
      <span className="text-muted-foreground">{formatDateTime(o.createdAt)}</span>
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
    <div className="space-y-6">
      {/* 页头 */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">仪表盘</h1>
        <p className="mt-1 text-sm text-muted-foreground">
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

      {/* 系统健康 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {health.map((h) => {
          const Icon = h.icon;
          return (
            <Card key={h.label}>
              <CardContent className="flex items-center gap-4 p-5">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    h.ok
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-red-500/10 text-red-600 dark:text-red-400",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{h.label}</p>
                  <p className="text-lg font-bold tracking-tight">{h.value}</p>
                  <p className="text-[11px] text-muted-foreground">{h.hint}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 最近注册用户 + 最近交易 */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">最近注册用户</CardTitle>
              <Link
                href="/admin/users"
                className="inline-flex items-center text-xs text-lynx-600 hover:text-lynx-500 dark:text-lynx-400"
              >
                查看全部
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={userColumns}
                data={RECENT_USERS}
                rowKey={(u) => u.id}
              />
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">最近交易</CardTitle>
              <Link
                href="/admin/orders"
                className="inline-flex items-center text-xs text-lynx-600 hover:text-lynx-500 dark:text-lynx-400"
              >
                查看全部
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={orderColumns}
                data={RECENT_ORDERS}
                rowKey={(o) => o.id}
              />
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
