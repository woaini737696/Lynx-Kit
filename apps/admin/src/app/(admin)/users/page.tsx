"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, type AdminUser } from "@/lib/api";
import { formatDate, formatPhone } from "@/lib/utils";

/** 后端实际返回的时间戳字段，本地扩展类型 */
interface UserRow extends AdminUser {
  createdAt: string;
  updatedAt: string;
}

const ROLE_OPTIONS = [
  { value: "", label: "全部角色" },
  { value: "USER", label: "普通用户" },
  { value: "CREATOR", label: "创作者" },
  { value: "ADMIN", label: "管理员" },
  { value: "SUPER_ADMIN", label: "超级管理员" },
];

const STATUS_OPTIONS = [
  { value: "", label: "全部状态" },
  { value: "ACTIVE", label: "正常" },
  { value: "SUSPENDED", label: "已封禁" },
  { value: "DELETED", label: "已删除" },
];

const ROLE_LABELS: Record<string, string> = {
  USER: "普通用户",
  CREATOR: "创作者",
  ADMIN: "管理员",
  SUPER_ADMIN: "超级管理员",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "正常",
  SUSPENDED: "已封禁",
  DELETED: "已删除",
};

const PAGE_SIZE = 10;

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // 编辑弹窗
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    role: "USER",
    status: "ACTIVE",
  });
  const [saving, setSaving] = useState(false);

  // 删除确认
  const [deletingUser, setDeletingUser] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.getUsers({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        status: statusFilter || undefined,
        role: roleFilter || undefined,
      });
      setUsers(res.list as UserRow[]);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
    setRoleFilter("");
    setPage(1);
  }

  function openEdit(user: UserRow) {
    setEditingUser(user);
    setEditForm({
      name: user.name ?? "",
      role: user.role,
      status: user.status,
    });
  }

  function closeEdit() {
    setEditingUser(null);
  }

  async function handleSave() {
    if (!editingUser) return;
    setSaving(true);
    try {
      await adminApi.updateUser(editingUser.id, {
        name: editForm.name.trim() || null,
        role: editForm.role,
        status: editForm.status,
      });
      setEditingUser(null);
      showToast("用户信息已更新");
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingUser) return;
    setDeleting(true);
    try {
      await adminApi.deleteUser(deletingUser.id);
      setDeletingUser(null);
      showToast("用户已删除");
      fetchUsers();
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
          <h1 className="text-2xl font-semibold tracking-tight text-ink-950">用户管理</h1>
          <p className="mt-1 text-sm text-ink-500">管理平台用户、角色与状态</p>
        </div>
        <span className="text-sm text-ink-400">共 {total} 位用户</span>
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
              placeholder="搜索手机号 / 姓名 / 邮箱"
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

          {/* 角色筛选 */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="glass-input cursor-pointer py-2 px-3 text-sm text-ink-950"
          >
            {ROLE_OPTIONS.map((opt) => (
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

      {/* 用户表格 */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left">
            <thead>
              <tr className="border-b border-ink-200 bg-ink-50/60">
                <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500">用户</th>
                <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500">手机号</th>
                <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500">角色</th>
                <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500">状态</th>
                <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500">注册时间</th>
                <th className="px-5 py-3.5 text-right text-xs font-medium uppercase tracking-wider text-ink-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-sm text-ink-400">
                    加载中...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-sm text-ink-400">
                    暂无用户数据
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-ink-50/60">
                    {/* 用户（头像 + 姓名 + 邮箱） */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={user.avatar}
                            alt=""
                            className="h-9 w-9 flex-shrink-0 rounded-full object-cover ring-1 ring-ink-200"
                          />
                        ) : (
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-ink-200 text-sm font-medium text-ink-700">
                            {user.name?.[0]?.toUpperCase() ?? "U"}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink-950">
                            {user.name || "未命名"}
                          </p>
                          {user.email && (
                            <p className="truncate text-xs text-ink-400">{user.email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* 手机号 */}
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-sm text-ink-700">
                        {formatPhone(user.phone)}
                      </span>
                    </td>
                    {/* 角色 */}
                    <td className="px-5 py-3.5">
                      <span className="badge-ink">{ROLE_LABELS[user.role] ?? user.role}</span>
                    </td>
                    {/* 状态 */}
                    <td className="px-5 py-3.5">
                      <StatusBadge status={user.status} />
                    </td>
                    {/* 注册时间 */}
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-ink-600">
                        {user.createdAt ? formatDate(user.createdAt) : "—"}
                      </span>
                    </td>
                    {/* 操作 */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(user)}
                          className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => setDeletingUser(user)}
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
      {editingUser && (
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
                  <h2 className="text-base font-semibold text-ink-950">编辑用户</h2>
                  <p className="text-xs text-ink-400">{formatPhone(editingUser.phone)}</p>
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

            <div className="space-y-4">
              {/* 姓名 */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-600">姓名</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="请输入姓名"
                  className="glass-input w-full px-3.5 py-2.5 text-sm text-ink-950 placeholder:text-ink-400"
                />
              </div>

              {/* 角色 */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-600">角色</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="glass-input w-full cursor-pointer px-3.5 py-2.5 text-sm text-ink-950"
                >
                  {ROLE_OPTIONS.filter((o) => o.value).map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-white text-ink-950">
                      {opt.label}
                    </option>
                  ))}
                </select>
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
      {deletingUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-[40px]"
          onClick={() => !deleting && setDeletingUser(null)}
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
            <h2 className="text-center text-base font-semibold text-ink-950">删除用户</h2>
            <p className="mt-2 text-center text-sm text-ink-500">
              确定要删除用户
              <span className="mx-1 font-medium text-ink-950">
                {deletingUser.name || formatPhone(deletingUser.phone)}
              </span>
              吗？该操作为软删除，可由后台恢复。
            </p>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setDeletingUser(null)}
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
  if (status === "ACTIVE") {
    return <span className="badge-ink">{label}</span>;
  }
  if (status === "SUSPENDED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-ink-300 bg-ink-100 px-2.5 py-0.5 text-xs font-medium text-ink-700">
        <span className="h-1.5 w-1.5 rounded-full bg-ink-500" />
        {label}
      </span>
    );
  }
  // DELETED
  return (
    <span className="inline-flex items-center rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-medium text-ink-400 line-through">
      {label}
    </span>
  );
}
