"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, type PageResult } from "@/lib/api";
import { formatDate } from "@/lib/utils";

/** 商店产品行 - 后端返回字段的本地类型扩展 */
interface StoreProduct {
  id: string;
  name: string;
  description?: string;
  pricingType:
    | "FREE"
    | "PAY_PER_USE"
    | "SUBSCRIPTION"
    | "EXCHANGE"
    | "ENTERPRISE";
  price: number;
  status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "SUSPENDED";
  category: string;
  createdAt: string;
  updatedAt: string;
}

const PRICING_LABELS: Record<string, string> = {
  FREE: "免费",
  PAY_PER_USE: "按次付费",
  SUBSCRIPTION: "订阅",
  EXCHANGE: "兑换",
  ENTERPRISE: "企业版",
};

const STATUS_OPTIONS = [
  { value: "", label: "全部状态" },
  { value: "DRAFT", label: "草稿" },
  { value: "PENDING_REVIEW", label: "待审核" },
  { value: "PUBLISHED", label: "已上架" },
  { value: "REJECTED", label: "已拒绝" },
  { value: "SUSPENDED", label: "已下架" },
];

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "草稿",
  PENDING_REVIEW: "待审核",
  PUBLISHED: "已上架",
  REJECTED: "已拒绝",
  SUSPENDED: "已下架",
};

const PAGE_SIZE = 10;

function formatPrice(product: StoreProduct): string {
  if (product.pricingType === "FREE") return "免费";
  if (product.price == null || product.price === 0) return "—";
  return `¥${product.price}`;
}

export default function StorePage() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // 编辑弹窗
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(
    null,
  );
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    status: "DRAFT",
    category: "",
    price: "0",
  });
  const [saving, setSaving] = useState(false);

  // 删除确认
  const [deletingProduct, setDeletingProduct] = useState<StoreProduct | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = (await adminApi.getStoreProducts({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        status: statusFilter || undefined,
      })) as PageResult<StoreProduct>;
      setProducts(res.list ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // 短暂提示
  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2400);
  }

  function handleSearch() {
    setPage(1);
    setSearch(searchInput.trim());
  }

  function handleReset() {
    setSearchInput("");
    setSearch("");
    setStatusFilter("");
    setPage(1);
  }

  function openEdit(product: StoreProduct) {
    setEditingProduct(product);
    setEditForm({
      name: product.name ?? "",
      description: product.description ?? "",
      status: product.status,
      category: product.category ?? "",
      price: String(product.price ?? 0),
    });
  }

  function closeEdit() {
    setEditingProduct(null);
  }

  async function handleSave() {
    if (!editingProduct) return;
    setSaving(true);
    try {
      await adminApi.updateStoreProduct(editingProduct.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        status: editForm.status,
        category: editForm.category.trim(),
        price: Number(editForm.price) || 0,
      });
      setEditingProduct(null);
      showToast("产品信息已更新");
      fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingProduct) return;
    setDeleting(true);
    try {
      await adminApi.deleteStoreProduct(deletingProduct.id);
      setDeletingProduct(null);
      showToast("产品已删除");
      fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    } finally {
      setDeleting(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-950">
            AI 应用商店
          </h1>
          <p className="mt-1 text-sm text-ink-500">管理商店产品、状态与定价</p>
        </div>
        <span className="text-sm text-ink-400">共 {total} 个产品</span>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => setError("")}
            className="text-red-400 hover:text-red-600"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* 筛选栏 */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* 搜索框 */}
          <div className="relative min-w-[260px] flex-1">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder="搜索产品名称 / 描述"
              className="glass-input w-full py-2 pl-9 pr-3 text-sm text-ink-950 placeholder:text-ink-400"
            />
          </div>

          {/* 状态筛选 */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="glass-input cursor-pointer py-2 px-3 text-sm text-ink-950"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-white text-ink-950">
                {opt.label}
              </option>
            ))}
          </select>

          <button onClick={handleSearch} className="btn-ink text-sm">
            搜索
          </button>
          <button
            onClick={handleReset}
            className="rounded-full px-4 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950"
          >
            重置
          </button>
        </div>
      </div>

      {/* 产品表格 */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead>
              <tr className="border-b border-ink-200 bg-ink-50/60">
                <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500">产品</th>
                <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500">分类</th>
                <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500">定价类型</th>
                <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500">价格</th>
                <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500">状态</th>
                <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500">创建时间</th>
                <th className="px-5 py-3.5 text-right text-xs font-medium uppercase tracking-wider text-ink-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-sm text-ink-400">
                    加载中...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-sm text-ink-400">
                    暂无产品数据
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="transition-colors hover:bg-ink-50/60">
                    {/* 产品（图标 + 名称 + 描述） */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-700">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="m7 7 3 3 7-7" />
                            <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.66 0 3.21.45 4.54 1.24" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink-950">
                            {product.name || "未命名"}
                          </p>
                          {product.description && (
                            <p className="truncate text-xs text-ink-400">{product.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* 分类 */}
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-ink-700">
                        {product.category || "—"}
                      </span>
                    </td>
                    {/* 定价类型 */}
                    <td className="px-5 py-3.5">
                      <span className="badge-ink">
                        {PRICING_LABELS[product.pricingType] ?? product.pricingType}
                      </span>
                    </td>
                    {/* 价格 */}
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-ink-700">
                        {formatPrice(product)}
                      </span>
                    </td>
                    {/* 状态 */}
                    <td className="px-5 py-3.5">
                      <StatusBadge status={product.status} />
                    </td>
                    {/* 创建时间 */}
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-ink-600">
                        {product.createdAt ? formatDate(product.createdAt) : "—"}
                      </span>
                    </td>
                    {/* 操作 */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(product)}
                          className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => setDeletingProduct(product)}
                          className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink-600 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        <div className="flex items-center justify-between border-t border-ink-200 px-5 py-3.5">
          <p className="text-xs text-ink-400">
            {total > 0 ? `显示 ${start}-${end} 条，共 ${total} 条` : "无数据"}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="flex items-center gap-1 rounded-full border border-ink-200 px-3.5 py-1.5 text-sm font-medium text-ink-700 transition-all hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              上一页
            </button>
            <span className="px-2 text-sm text-ink-500">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="flex items-center gap-1 rounded-full border border-ink-200 px-3.5 py-1.5 text-sm font-medium text-ink-700 transition-all hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              下一页
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 编辑弹窗 */}
      {editingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-[40px]"
          onClick={closeEdit}
        >
          <div
            className="glass-card-strong m-4 w-full max-w-md p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-950 text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-ink-950">编辑产品</h2>
                  <p className="text-xs text-ink-400">
                    {PRICING_LABELS[editingProduct.pricingType] ?? editingProduct.pricingType}
                  </p>
                </div>
              </div>
              <button
                onClick={closeEdit}
                className="text-ink-400 transition-colors hover:text-ink-950"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
              {/* 名称 */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-600">名称</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="请输入产品名称"
                  className="glass-input w-full px-3.5 py-2.5 text-sm text-ink-950 placeholder:text-ink-400"
                />
              </div>

              {/* 描述 */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-600">描述</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="请输入产品描述"
                  rows={3}
                  className="glass-input w-full resize-none px-3.5 py-2.5 text-sm text-ink-950 placeholder:text-ink-400"
                />
              </div>

              {/* 分类 */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-600">分类</label>
                <input
                  type="text"
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  placeholder="请输入分类"
                  className="glass-input w-full px-3.5 py-2.5 text-sm text-ink-950 placeholder:text-ink-400"
                />
              </div>

              {/* 状态 */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-600">状态</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="glass-input w-full cursor-pointer px-3.5 py-2.5 text-sm text-ink-950"
                >
                  {STATUS_OPTIONS.filter((o) => o.value).map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-white text-ink-950">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 价格 */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-600">价格</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  placeholder="请输入价格"
                  className="glass-input w-full px-3.5 py-2.5 text-sm text-ink-950 placeholder:text-ink-400"
                />
              </div>
            </div>

            <div className="mt-7 flex justify-end gap-2">
              <button
                onClick={closeEdit}
                className="rounded-full px-5 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-ink text-sm"
              >
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deletingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-[40px]"
          onClick={() => !deleting && setDeletingProduct(null)}
        >
          <div
            className="glass-card-strong m-4 w-full max-w-sm p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ink-100">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-700">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </div>
            <h2 className="text-center text-base font-semibold text-ink-950">删除产品</h2>
            <p className="mt-2 text-center text-sm text-ink-500">
              确定要删除产品
              <span className="mx-1 font-medium text-ink-950">
                {deletingProduct.name || "未命名"}
              </span>
              吗？该操作不可恢复。
            </p>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setDeletingProduct(null)}
                disabled={deleting}
                className="flex-1 rounded-full border border-ink-200 px-5 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100 disabled:opacity-40"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white transition-all hover:bg-red-700 disabled:opacity-40"
              >
                {deleting ? "删除中..." : "确认删除"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast 提示 */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink-950 px-5 py-2.5 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

/** 状态徽章 - 在灰阶范围内区分不同状态 */
function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] ?? status;
  if (status === "PUBLISHED") {
    return <span className="badge-ink">{label}</span>;
  }
  if (status === "PENDING_REVIEW") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-ink-300 bg-ink-100 px-2.5 py-0.5 text-xs font-medium text-ink-700">
        <span className="h-1.5 w-1.5 rounded-full bg-ink-500" />
        {label}
      </span>
    );
  }
  if (status === "DRAFT") {
    return (
      <span className="inline-flex items-center rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-medium text-ink-500">
        {label}
      </span>
    );
  }
  if (status === "REJECTED") {
    return (
      <span className="inline-flex items-center rounded-full border border-ink-300 bg-ink-50 px-2.5 py-0.5 text-xs font-medium text-ink-700">
        {label}
      </span>
    );
  }
  // SUSPENDED
  return (
    <span className="inline-flex items-center rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-medium text-ink-400 line-through">
      {label}
    </span>
  );
}
