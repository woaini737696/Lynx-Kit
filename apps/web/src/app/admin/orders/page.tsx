"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  toast,
} from "@lynxkit/ui-web";
import { DataTable, type Column } from "@/components/admin/data-table";
import { cn, formatDateTime, formatPrice } from "@/lib/utils";

/**
 * 订单管理 - iOS26 极简黑白灰毛玻璃风格
 *
 * 订单列表 + 状态筛选 + 退款操作。数据为占位 mock，后续接入 adminApi.listOrders()。
 */

type OrderStatus = "pending" | "completed" | "refunded" | "failed";

interface AdminOrder {
  id: string;
  product: string;
  buyer: string;
  seller: string;
  amount: number; // 分
  status: OrderStatus;
  createdAt: string;
}

const ORDERS: AdminOrder[] = [
  { id: "tx-2048", product: "AI 陪伴聊天", buyer: "周杰", seller: "陈思远", amount: 9900, status: "completed", createdAt: "2026-07-02T09:30:00Z" },
  { id: "tx-2047", product: "智能 BI 报表", buyer: "Linda Wang", seller: "张明", amount: 29900, status: "completed", createdAt: "2026-07-02T08:11:00Z" },
  { id: "tx-2046", product: "轻量 CRM", buyer: "陈思远", seller: "Linda Wang", amount: 19900, status: "pending", createdAt: "2026-07-01T23:50:00Z" },
  { id: "tx-2045", product: "AI 知识库", buyer: "Sophie", seller: "Sophie", amount: 9900, status: "refunded", createdAt: "2026-07-01T17:02:00Z" },
  { id: "tx-2044", product: "智能家居中枢", buyer: "Mike Liu", seller: "Mike Liu", amount: 39900, status: "completed", createdAt: "2026-07-01T12:33:00Z" },
  { id: "tx-2043", product: "自动化平台", buyer: "Vincent", seller: "Vincent", amount: 49900, status: "failed", createdAt: "2026-07-01T10:18:00Z" },
  { id: "tx-2042", product: "内容发布平台", buyer: "Alex Chen", seller: "Alex Chen", amount: 0, status: "completed", createdAt: "2026-07-01T07:45:00Z" },
  { id: "tx-2041", product: "预约服务 App", buyer: "王芳", seller: "王芳", amount: 14900, status: "completed", createdAt: "2026-06-30T22:09:00Z" },
  { id: "tx-2040", product: "AI 匹配社交", buyer: "周杰", seller: "周杰", amount: 0, status: "completed", createdAt: "2026-06-30T18:27:00Z" },
  { id: "tx-2039", product: "轻量 CRM", buyer: "韩梅梅", seller: "Linda Wang", amount: 19900, status: "refunded", createdAt: "2026-06-30T14:55:00Z" },
];

const ORDER_STATUS: Record<
  OrderStatus,
  { label: string; tone: "ink" | "muted" | "outline" | "destructive" }
> = {
  pending: { label: "待支付", tone: "muted" },
  completed: { label: "已完成", tone: "ink" },
  refunded: { label: "已退款", tone: "outline" },
  failed: { label: "失败", tone: "destructive" },
};

function OrderBadge({ status }: { status: OrderStatus }) {
  const cfg = ORDER_STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        cfg.tone === "ink"
          ? "bg-ink-950 text-white dark:bg-ink-100 dark:text-ink-950"
          : cfg.tone === "muted"
            ? "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300"
            : cfg.tone === "destructive"
              ? "bg-ink-950 text-white dark:bg-ink-100 dark:text-ink-950"
              : "border border-ink-200 text-ink-500 dark:border-ink-700 dark:text-ink-400",
      )}
    >
      {cfg.label}
    </span>
  );
}

const STATUS_FILTERS = ["全部", "已完成", "待支付", "已退款", "失败"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const FILTER_TO_STATUS: Record<StatusFilter, OrderStatus | null> = {
  全部: null,
  已完成: "completed",
  待支付: "pending",
  已退款: "refunded",
  失败: "failed",
};

export default function AdminOrdersPage() {
  const [items, setItems] = React.useState<AdminOrder[]>(ORDERS);
  const [filter, setFilter] = React.useState<StatusFilter>("全部");
  const [refundTarget, setRefundTarget] = React.useState<AdminOrder | null>(null);
  const [refunding, setRefunding] = React.useState(false);

  const filtered = React.useMemo(() => {
    const target = FILTER_TO_STATUS[filter];
    if (!target) return items;
    return items.filter((o) => o.status === target);
  }, [items, filter]);

  function handleRefund() {
    if (!refundTarget) return;
    setRefunding(true);
    // TODO: 调用 adminApi.refund(refundTarget.id)
    setTimeout(() => {
      setItems((prev) =>
        prev.map((o) =>
          o.id === refundTarget.id ? { ...o, status: "refunded" } : o,
        ),
      );
      toast({
        title: "退款成功",
        description: `订单 ${refundTarget.id} 已退款 ${formatPrice(refundTarget.amount)}`,
      });
      setRefundTarget(null);
      setRefunding(false);
    }, 400);
  }

  const columns: Column<AdminOrder>[] = [
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
      key: "seller",
      header: "卖家",
      cell: (o) => <span className="text-ink-500 dark:text-ink-400">{o.seller}</span>,
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
      header: "创建时间",
      sortable: true,
      sortValue: (o) => o.createdAt,
      cell: (o) => (
        <span className="text-ink-500 dark:text-ink-400">
          {formatDateTime(o.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "操作",
      className: "text-right",
      cell: (o) =>
        o.status === "completed" ? (
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-ink-200/60 bg-white/55 px-3 text-xs font-medium text-ink-700 backdrop-blur-xl transition-all hover:bg-white/72 hover:text-ink-950 dark:border-ink-700/60 dark:bg-white/5 dark:text-ink-200 dark:hover:bg-white/10 dark:hover:text-ink-50"
            onClick={() => setRefundTarget(o)}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            退款
          </button>
        ) : (
          <span className="text-xs text-ink-400">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-[-0.02em] text-ink-950 dark:text-ink-50">
            订单管理
          </h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            查看平台交易订单并处理退款
          </p>
        </div>
        <div className="inline-flex gap-1 rounded-full border border-white/40 bg-white/55 p-1 backdrop-blur-xl backdrop-saturate-150 dark:border-white/5 dark:bg-white/5">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition-all",
                filter === s
                  ? "bg-ink-950 text-white shadow-sm dark:bg-ink-100 dark:text-ink-950"
                  : "text-ink-500 hover:text-ink-950 dark:text-ink-400 dark:hover:text-ink-50",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="glow-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-[-0.01em] text-ink-950 dark:text-ink-50">
            全部订单
          </h2>
          <span className="text-xs text-ink-500 dark:text-ink-400">
            {filtered.length} 笔
          </span>
        </div>
        <DataTable columns={columns} data={filtered} rowKey={(o) => o.id} />
      </div>

      {/* 退款确认弹窗 - 毛玻璃 */}
      <Dialog
        open={refundTarget !== null}
        onOpenChange={(open) => !open && setRefundTarget(null)}
      >
        <DialogContent className="rounded-[28px] border-white/70 bg-white/72 backdrop-blur-2xl backdrop-saturate-200 dark:border-white/10 dark:bg-ink-900/72">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold tracking-[-0.02em] text-ink-950 dark:text-ink-50">
              确认退款
            </DialogTitle>
            <DialogDescription className="text-ink-500 dark:text-ink-400">
              退款后订单状态将变为「已退款」，且不可撤销。请确认操作。
            </DialogDescription>
          </DialogHeader>
          {refundTarget ? (
            <div className="space-y-2 rounded-2xl border border-ink-200/60 bg-white/55 p-4 text-sm backdrop-blur-xl dark:border-ink-800/60 dark:bg-white/5">
              <div className="flex justify-between">
                <span className="text-ink-500 dark:text-ink-400">订单号</span>
                <span className="font-mono text-ink-900 dark:text-ink-50">{refundTarget.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500 dark:text-ink-400">商品</span>
                <span className="font-medium text-ink-900 dark:text-ink-50">{refundTarget.product}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500 dark:text-ink-400">买家</span>
                <span className="text-ink-900 dark:text-ink-50">{refundTarget.buyer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500 dark:text-ink-400">退款金额</span>
                <span className="font-semibold text-ink-950 dark:text-ink-50">
                  {formatPrice(refundTarget.amount)}
                </span>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <button
              type="button"
              onClick={() => setRefundTarget(null)}
              disabled={refunding}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-ink-200/60 bg-white/55 px-5 text-sm font-medium text-ink-700 backdrop-blur-xl transition-all hover:bg-white/72 hover:text-ink-950 disabled:opacity-50 dark:border-ink-700/60 dark:bg-white/5 dark:text-ink-200 dark:hover:bg-white/10 dark:hover:text-ink-50"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleRefund}
              disabled={refunding}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-ink-950 px-5 text-sm font-medium text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)] transition-all hover:bg-ink-800 disabled:opacity-50 dark:bg-ink-100 dark:text-ink-950 dark:hover:bg-ink-200"
            >
              {refunding ? "处理中…" : "确认退款"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
