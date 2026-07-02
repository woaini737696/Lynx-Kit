"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
 * 订单管理
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
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  pending: { label: "待支付", variant: "secondary" },
  completed: { label: "已完成", variant: "default" },
  refunded: { label: "已退款", variant: "outline" },
  failed: { label: "失败", variant: "destructive" },
};

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
      key: "seller",
      header: "卖家",
      cell: (o) => <span className="text-muted-foreground">{o.seller}</span>,
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
      header: "创建时间",
      sortable: true,
      sortValue: (o) => o.createdAt,
      cell: (o) => (
        <span className="text-muted-foreground">{formatDateTime(o.createdAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "操作",
      className: "text-right",
      cell: (o) =>
        o.status === "completed" ? (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs text-red-600 hover:text-red-700"
            onClick={() => setRefundTarget(o)}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            退款
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">订单管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            查看平台交易订单并处理退款
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-border bg-muted p-1 text-sm">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={cn(
                "rounded-md px-3 py-1.5 transition",
                filter === s
                  ? "bg-background font-medium shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            全部订单
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {filtered.length} 笔
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filtered} rowKey={(o) => o.id} />
        </CardContent>
      </Card>

      {/* 退款确认弹窗 */}
      <Dialog
        open={refundTarget !== null}
        onOpenChange={(open) => !open && setRefundTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认退款</DialogTitle>
            <DialogDescription>
              退款后订单状态将变为「已退款」，且不可撤销。请确认操作。
            </DialogDescription>
          </DialogHeader>
          {refundTarget ? (
            <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">订单号</span>
                <span className="font-mono">{refundTarget.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">商品</span>
                <span className="font-medium">{refundTarget.product}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">买家</span>
                <span>{refundTarget.buyer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">退款金额</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {formatPrice(refundTarget.amount)}
                </span>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRefundTarget(null)}
              disabled={refunding}
            >
              取消
            </Button>
            <Button
              className="bg-red-500 text-white hover:bg-red-600"
              onClick={handleRefund}
              disabled={refunding}
            >
              {refunding ? "处理中…" : "确认退款"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
