"use client";

import * as React from "react";
import { toast } from "@lynxkit/ui-web";
import { DataTable, type Column } from "@/components/admin/data-table";
import { cn, formatPrice } from "@/lib/utils";
import { storeApi } from "@/lib/api";

/**
 * 商品管理 - iOS26 极简黑白灰毛玻璃风格
 *
 * 商品列表 + 审核状态切换 + 下架操作。
 * 下架通过 @lynxkit/api-client 的 StoreApi.unpublish 调用后端。
 */

type AuditStatus = "published" | "pending" | "rejected";

interface AdminProduct {
  id: string;
  name: string;
  category: string;
  creator: string;
  price: number; // 分
  status: AuditStatus;
  downloads: number;
  rating: number;
}

const PRODUCTS: AdminProduct[] = [
  { id: "ai-companion-chat", name: "AI 陪伴聊天", category: "AI 社交", creator: "陈思远", price: 9900, status: "published", downloads: 1248, rating: 4.9 },
  { id: "mini-crm", name: "轻量 CRM", category: "AI 管理后台", creator: "Linda Wang", price: 19900, status: "published", downloads: 856, rating: 4.7 },
  { id: "smart-bi", name: "智能 BI 报表", category: "AI 数据分析", creator: "张明", price: 29900, status: "published", downloads: 624, rating: 4.8 },
  { id: "content-publish", name: "内容发布平台", category: "AI 营销", creator: "Alex Chen", price: 0, status: "published", downloads: 2310, rating: 4.6 },
  { id: "booking-app", name: "预约服务 App", category: "AI 应用 App", creator: "王芳", price: 14900, status: "pending", downloads: 0, rating: 0 },
  { id: "smart-iot-hub", name: "智能家居中枢", category: "AI 硬件", creator: "Mike Liu", price: 39900, status: "published", downloads: 198, rating: 4.9 },
  { id: "knowledge-base", name: "AI 知识库", category: "AI 工作站", creator: "Sophie", price: 9900, status: "published", downloads: 1843, rating: 4.7 },
  { id: "social-match", name: "AI 匹配社交", category: "AI 社交", creator: "周杰", price: 0, status: "published", downloads: 5230, rating: 4.8 },
  { id: "auto-platform", name: "自动化平台", category: "AI 系统", creator: "Vincent", price: 49900, status: "rejected", downloads: 0, rating: 0 },
  { id: "team-doc-qa", name: "团队文档问答", category: "AI 工作站", creator: "Sophie", price: 12900, status: "pending", downloads: 0, rating: 0 },
];

const AUDIT: Record<
  AuditStatus,
  { label: string; tone: "ink" | "muted" | "outline" }
> = {
  published: { label: "已上架", tone: "ink" },
  pending: { label: "待审核", tone: "muted" },
  rejected: { label: "已驳回", tone: "outline" },
};

const STATUS_FILTERS = ["全部", "已上架", "待审核", "已驳回"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const FILTER_TO_STATUS: Record<StatusFilter, AuditStatus | null> = {
  全部: null,
  已上架: "published",
  待审核: "pending",
  已驳回: "rejected",
};

function AuditBadge({ status }: { status: AuditStatus }) {
  const cfg = AUDIT[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
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

export default function AdminProductsPage() {
  const [items, setItems] = React.useState<AdminProduct[]>(PRODUCTS);
  const [filter, setFilter] = React.useState<StatusFilter>("全部");

  const filtered = React.useMemo(() => {
    const target = FILTER_TO_STATUS[filter];
    if (!target) return items;
    return items.filter((p) => p.status === target);
  }, [items, filter]);

  function setAuditStatus(id: string, status: AuditStatus) {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  }

  async function handleUnpublish(p: AdminProduct) {
    try {
      await storeApi.unpublish(p.id);
      setAuditStatus(p.id, "rejected");
      toast({ title: "已下架", description: p.name });
    } catch {
      // 离线 / 后端未就绪时，本地更新仍生效（便于演示）
      setAuditStatus(p.id, "rejected");
      toast({ title: "已下架（本地）", description: p.name });
    }
  }

  function handleApprove(p: AdminProduct) {
    setAuditStatus(p.id, "published");
    toast({ title: "已通过审核", description: p.name });
  }

  function handleReject(p: AdminProduct) {
    setAuditStatus(p.id, "rejected");
    toast({ title: "已驳回", description: p.name });
  }

  const columns: Column<AdminProduct>[] = [
    {
      key: "name",
      header: "商品",
      cell: (p) => (
        <div>
          <p className="font-medium text-ink-900 dark:text-ink-50">{p.name}</p>
          <p className="text-xs text-ink-500 dark:text-ink-400">{p.category}</p>
        </div>
      ),
    },
    {
      key: "creator",
      header: "创作者",
      cell: (p) => <span className="text-ink-500 dark:text-ink-400">{p.creator}</span>,
    },
    {
      key: "price",
      header: "价格",
      sortable: true,
      sortValue: (p) => p.price,
      cell: (p) => (
        <span className="font-semibold text-ink-950 dark:text-ink-50">
          {p.price === 0 ? "免费" : formatPrice(p.price)}
        </span>
      ),
    },
    {
      key: "downloads",
      header: "下载",
      sortable: true,
      sortValue: (p) => p.downloads,
      cell: (p) => (
        <span className="text-ink-500 dark:text-ink-400">
          {p.downloads.toLocaleString()}
        </span>
      ),
    },
    {
      key: "rating",
      header: "评分",
      sortable: true,
      sortValue: (p) => p.rating,
      cell: (p) =>
        p.rating > 0 ? (
          <span className="inline-flex items-center gap-1 text-ink-950 dark:text-ink-50">
            <span className="text-ink-950 dark:text-ink-50">★</span>
            {p.rating.toFixed(1)}
          </span>
        ) : (
          <span className="text-ink-400">—</span>
        ),
    },
    {
      key: "status",
      header: "状态",
      cell: (p) => <AuditBadge status={p.status} />,
    },
    {
      key: "actions",
      header: "操作",
      className: "text-right",
      cell: (p) => (
        <div className="flex items-center justify-end gap-2">
          {p.status === "pending" ? (
            <>
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-ink-950 px-3 text-xs font-medium text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)] transition-all hover:bg-ink-800 dark:bg-ink-100 dark:text-ink-950 dark:hover:bg-ink-200"
                onClick={() => handleApprove(p)}
              >
                通过
              </button>
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-ink-200/60 bg-white/55 px-3 text-xs font-medium text-ink-700 backdrop-blur-xl transition-all hover:bg-white/72 hover:text-ink-950 dark:border-ink-700/60 dark:bg-white/5 dark:text-ink-200 dark:hover:bg-white/10 dark:hover:text-ink-50"
                onClick={() => handleReject(p)}
              >
                驳回
              </button>
            </>
          ) : p.status === "published" ? (
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-ink-200/60 bg-white/55 px-3 text-xs font-medium text-ink-500 backdrop-blur-xl transition-all hover:bg-white/72 hover:text-ink-950 dark:border-ink-700/60 dark:bg-white/5 dark:text-ink-300 dark:hover:bg-white/10 dark:hover:text-ink-50"
              onClick={() => void handleUnpublish(p)}
            >
              下架
            </button>
          ) : (
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-ink-200/60 bg-white/55 px-3 text-xs font-medium text-ink-700 backdrop-blur-xl transition-all hover:bg-white/72 hover:text-ink-950 dark:border-ink-700/60 dark:bg-white/5 dark:text-ink-200 dark:hover:bg-white/10 dark:hover:text-ink-50"
              onClick={() => handleApprove(p)}
            >
              重新上架
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-[-0.02em] text-ink-950 dark:text-ink-50">
            商品管理
          </h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            审核创作者上架的商品，下架违规内容
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
            全部商品
          </h2>
          <span className="text-xs text-ink-500 dark:text-ink-400">
            {filtered.length} 件
          </span>
        </div>
        <DataTable
          columns={columns}
          data={filtered}
          rowKey={(p) => p.id}
        />
      </div>
    </div>
  );
}
