"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";

/** 构建会话（列表行） */
interface BuildSession {
  id: string;
  userId: string;
  productType: string;
  name: string;
  description?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/** 构建会话详情（含日志） */
interface BuildDetail extends BuildSession {
  logs?: BuildLog[];
}

/** 构建日志 */
interface BuildLog {
  id?: string;
  agent?: string;
  level?: string;
  message?: string;
  createdAt?: string;
  timestamp?: string;
  time?: string;
}

const STATUS_OPTIONS = [
  { value: "", label: "全部状态" },
  { value: "DRAFT", label: "草稿" },
  { value: "CLARIFYING", label: "需求澄清" },
  { value: "ARCHITECTING", label: "架构设计" },
  { value: "DEVELOPING", label: "开发中" },
  { value: "TESTING", label: "测试中" },
  { value: "DEPLOYING", label: "部署中" },
  { value: "DEPLOYED", label: "已部署" },
  { value: "ERROR", label: "错误" },
];

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "草稿",
  CLARIFYING: "需求澄清",
  ARCHITECTING: "架构设计",
  DEVELOPING: "开发中",
  TESTING: "测试中",
  DEPLOYING: "部署中",
  DEPLOYED: "已部署",
  ERROR: "错误",
};

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  SOCIAL: "社交",
  SYSTEM: "系统",
  WORKSTATION: "工作站",
  DATA: "数据",
  ADMIN: "管理",
  APP: "应用",
  MARKETING: "营销",
  HARDWARE: "硬件",
};

const PAGE_SIZE = 10;
const LOG_LIMIT = 50;

export default function BuildsPage() {
  const [builds, setBuilds] = useState<BuildSession[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // 详情弹窗
  const [detailBuild, setDetailBuild] = useState<BuildDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 删除确认
  const [deletingBuild, setDeletingBuild] = useState<BuildSession | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBuilds = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.getBuilds({
        page,
        pageSize: PAGE_SIZE,
        status: statusFilter || undefined,
      }) as { list: BuildSession[]; total: number };
      setBuilds(res.list ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchBuilds();
  }, [fetchBuilds]);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2400);
  }

  async function openDetail(build: BuildSession) {
    setDetailBuild({ ...build });
    setDetailLoading(true);
    try {
      const detail = await adminApi.getBuildDetail(build.id);
      setDetailBuild(detail as BuildDetail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载详情失败");
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    setDetailBuild(null);
  }

  async function handleDelete() {
    if (!deletingBuild) return;
    setDeleting(true);
    try {
      await adminApi.deleteBuild(deletingBuild.id);
      setDeletingBuild(null);
      showToast("构建会话已删除");
      fetchBuilds();
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
          <h1 className="text-2xl font-semibold tracking-tight text-ink-950">代码库管理</h1>
          <p className="mt-1 text-sm text-ink-500">查看与维护 AI 构建会话</p>
        </div>
        <span className="text-sm text-ink-400">共 {total} 个会话</span>
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

          <button
            onClick={() => {
              setStatusFilter("");
              setPage(1);
            }}
            className="rounded-full px-4 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950"
          >
            重置
          </button>

          <div className="ml-auto">
            <button
              onClick={() => fetchBuilds()}
              disabled={loading}
              className="btn-ink text-sm disabled:opacity-40"
            >
              {loading ? "刷新中..." : "刷新"}
            </button>
          </div>
        </div>
      </div>

      {/* 构建会话表格 */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead>
              <tr className="border-b border-ink-200 bg-ink-50/60">
                <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500">会话ID</th>
                <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500">产品类型</th>
                <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500">名称</th>
                <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500">状态</th>
                <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500">创建时间</th>
                <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500">更新时间</th>
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
              ) : builds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-sm text-ink-400">
                    暂无构建会话
                  </td>
                </tr>
              ) : (
                builds.map((build) => (
                  <tr key={build.id} className="transition-colors hover:bg-ink-50/60">
                    {/* 会话ID（前8位） */}
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-sm text-ink-700">
                        {build.id.slice(0, 8)}
                      </span>
                    </td>
                    {/* 产品类型 */}
                    <td className="px-5 py-3.5">
                      <span className="badge-ink">
                        {PRODUCT_TYPE_LABELS[build.productType] ?? build.productType}
                      </span>
                    </td>
                    {/* 名称 */}
                    <td className="px-5 py-3.5">
                      <div className="min-w-0 max-w-[280px]">
                        <p className="truncate text-sm font-medium text-ink-950">
                          {build.name || "未命名"}
                        </p>
                        {build.description && (
                          <p className="truncate text-xs text-ink-400">{build.description}</p>
                        )}
                      </div>
                    </td>
                    {/* 状态 */}
                    <td className="px-5 py-3.5">
                      <StatusBadge status={build.status} />
                    </td>
                    {/* 创建时间 */}
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-ink-600">
                        {build.createdAt ? formatDate(build.createdAt) : "—"}
                      </span>
                    </td>
                    {/* 更新时间 */}
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-ink-600">
                        {build.updatedAt ? formatDate(build.updatedAt) : "—"}
                      </span>
                    </td>
                    {/* 操作 */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openDetail(build)}
                          className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950"
                        >
                          查看详情
                        </button>
                        <button
                          onClick={() => setDeletingBuild(build)}
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

      {/* 详情弹窗 */}
      {detailBuild && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-[40px]"
          onClick={closeDetail}
        >
          <div
            className="glass-card-strong m-4 flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 弹窗头 */}
            <div className="flex items-center justify-between border-b border-ink-200 px-7 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-950 text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-ink-950">构建会话详情</h2>
                  <p className="font-mono text-xs text-ink-400">{detailBuild.id.slice(0, 8)}</p>
                </div>
              </div>
              <button
                onClick={closeDetail}
                className="text-ink-400 transition-colors hover:text-ink-950"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* 弹窗体 */}
            <div className="flex-1 overflow-y-auto px-7 py-6">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <InfoField label="名称" value={detailBuild.name || "未命名"} />
                <InfoField
                  label="产品类型"
                  value={PRODUCT_TYPE_LABELS[detailBuild.productType] ?? detailBuild.productType}
                />
                <InfoField
                  label="状态"
                  valueNode={<StatusBadge status={detailBuild.status} />}
                />
                <InfoField label="用户ID" value={detailBuild.userId?.slice(0, 8) || "—"} mono />
                <InfoField
                  label="创建时间"
                  value={detailBuild.createdAt ? formatDate(detailBuild.createdAt) : "—"}
                />
                <InfoField
                  label="更新时间"
                  value={detailBuild.updatedAt ? formatDate(detailBuild.updatedAt) : "—"}
                />
              </div>

              {/* 描述 */}
              {detailBuild.description && (
                <div className="mt-6">
                  <p className="mb-1.5 text-xs font-medium text-ink-500">描述</p>
                  <p className="rounded-lg border border-ink-200 bg-ink-50/60 px-4 py-3 text-sm text-ink-700">
                    {detailBuild.description}
                  </p>
                </div>
              )}

              {/* 日志 */}
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wider text-ink-500">
                    最近日志
                  </p>
                  <span className="text-xs text-ink-400">
                    最多 {LOG_LIMIT} 条
                  </span>
                </div>

                {detailLoading ? (
                  <div className="rounded-lg border border-ink-200 bg-ink-50/60 px-4 py-12 text-center text-sm text-ink-400">
                    加载日志中...
                  </div>
                ) : (detailBuild.logs?.length ?? 0) > 0 ? (
                  <div className="overflow-hidden rounded-lg border border-ink-200">
                    <div className="max-h-[360px] overflow-y-auto">
                      <table className="w-full border-collapse text-left">
                        <thead className="sticky top-0">
                          <tr className="border-b border-ink-200 bg-ink-100/80 backdrop-blur">
                            <th className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-ink-500">Agent</th>
                            <th className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-ink-500">级别</th>
                            <th className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-ink-500">消息</th>
                            <th className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-ink-500 whitespace-nowrap">时间</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ink-200">
                          {(detailBuild.logs ?? []).slice(0, LOG_LIMIT).map((log, idx) => (
                            <tr key={log.id ?? idx} className="align-top hover:bg-ink-50/60">
                              <td className="px-3 py-2">
                                <span className="font-mono text-xs text-ink-700">
                                  {log.agent || "—"}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                <LogLevelBadge level={log.level} />
                              </td>
                              <td className="px-3 py-2">
                                <span className="text-xs text-ink-800 whitespace-pre-wrap break-words">
                                  {log.message || "—"}
                                </span>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                <span className="text-xs text-ink-500">
                                  {formatLogTime(log)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-ink-200 bg-ink-50/60 px-4 py-12 text-center text-sm text-ink-400">
                    暂无日志
                  </div>
                )}
              </div>
            </div>

            {/* 弹窗底 */}
            <div className="flex justify-end border-t border-ink-200 px-7 py-4">
              <button
                onClick={closeDetail}
                className="rounded-full px-5 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deletingBuild && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-[40px]"
          onClick={() => !deleting && setDeletingBuild(null)}
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
            <h2 className="text-center text-base font-semibold text-ink-950">删除构建会话</h2>
            <p className="mt-2 text-center text-sm text-ink-500">
              确定要删除构建会话
              <span className="mx-1 font-mono font-medium text-ink-950">
                {deletingBuild.id.slice(0, 8)}
              </span>
              吗？该操作不可恢复。
            </p>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setDeletingBuild(null)}
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

/** 信息字段 */
function InfoField({
  label,
  value,
  valueNode,
  mono,
}: {
  label: string;
  value?: string;
  valueNode?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-ink-500">{label}</p>
      {valueNode ? (
        valueNode
      ) : (
        <p className={`text-sm text-ink-950 ${mono ? "font-mono" : ""}`}>{value ?? "—"}</p>
      )}
    </div>
  );
}

/** 状态徽章 - 在灰阶范围内区分不同状态 */
function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] ?? status;
  if (status === "DEPLOYED") {
    return <span className="badge-ink">{label}</span>;
  }
  if (status === "ERROR") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        {label}
      </span>
    );
  }
  if (status === "DRAFT") {
    return (
      <span className="inline-flex items-center rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-medium text-ink-400">
        {label}
      </span>
    );
  }
  // 进行中：CLARIFYING / ARCHITECTING / DEVELOPING / TESTING / DEPLOYING
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-ink-300 bg-ink-100 px-2.5 py-0.5 text-xs font-medium text-ink-700">
      <span className="h-1.5 w-1.5 rounded-full bg-ink-500" />
      {label}
    </span>
  );
}

/** 日志级别徽章 - 不同颜色 */
function LogLevelBadge({ level }: { level?: string }) {
  const raw = (level ?? "INFO").toUpperCase();
  const label = raw;
  const cls: Record<string, string> = {
    INFO: "text-ink-600",
    WARN: "text-orange-600",
    ERROR: "text-red-600",
    DEBUG: "text-ink-400",
  };
  return (
    <span className={`font-mono text-xs font-semibold ${cls[raw] ?? "text-ink-600"}`}>
      {label}
    </span>
  );
}

/** 兼容多种日志时间字段命名 */
function formatLogTime(log: BuildLog): string {
  const t = log.createdAt ?? log.timestamp ?? log.time;
  return t ? formatDate(t) : "—";
}
