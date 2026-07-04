"use client";

import * as React from "react";
import { Search, X, UserCheck, UserX } from "lucide-react";
import { Input } from "@lynxkit/ui-web";
import { DataTable, type Column } from "@/components/admin/data-table";
import { cn, formatDateTime } from "@/lib/utils";

/**
 * 用户管理 - iOS26 极简黑白灰毛玻璃风格
 *
 * 搜索 + 角色筛选 + 分页。数据为占位 mock，后续接入 adminApi.listUsers()。
 */

type UserStatus = "active" | "suspended";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "用户" | "创作者" | "管理员";
  status: UserStatus;
  createdAt: string;
}

const ALL_USERS: AdminUser[] = [
  { id: "u-1024", name: "陈思远", email: "chen@example.com", role: "创作者", status: "active", createdAt: "2026-07-02T09:12:00Z" },
  { id: "u-1023", name: "Linda Wang", email: "linda@example.com", role: "用户", status: "active", createdAt: "2026-07-02T08:34:00Z" },
  { id: "u-1022", name: "张明", email: "zhang@example.com", role: "创作者", status: "active", createdAt: "2026-07-01T22:05:00Z" },
  { id: "u-1021", name: "Alex Chen", email: "alex@example.com", role: "用户", status: "suspended", createdAt: "2026-07-01T18:47:00Z" },
  { id: "u-1020", name: "王芳", email: "wang@example.com", role: "用户", status: "active", createdAt: "2026-07-01T14:21:00Z" },
  { id: "u-1019", name: "Mike Liu", email: "mike@example.com", role: "创作者", status: "active", createdAt: "2026-07-01T10:09:00Z" },
  { id: "u-1018", name: "Sophie", email: "sophie@example.com", role: "创作者", status: "active", createdAt: "2026-06-30T20:33:00Z" },
  { id: "u-1017", name: "周杰", email: "zhou@example.com", role: "用户", status: "active", createdAt: "2026-06-30T16:55:00Z" },
  { id: "u-1016", name: "Vincent", email: "vincent@example.com", role: "创作者", status: "active", createdAt: "2026-06-30T11:40:00Z" },
  { id: "u-1015", name: "赵敏", email: "zhao@example.com", role: "用户", status: "suspended", createdAt: "2026-06-30T08:18:00Z" },
  { id: "u-1014", name: "钱多", email: "qian@example.com", role: "用户", status: "active", createdAt: "2026-06-29T22:00:00Z" },
  { id: "u-1013", name: "孙莉", email: "sun@example.com", role: "创作者", status: "active", createdAt: "2026-06-29T17:45:00Z" },
  { id: "u-1012", name: "李雷", email: "li@example.com", role: "用户", status: "active", createdAt: "2026-06-29T13:27:00Z" },
  { id: "u-1011", name: "韩梅梅", email: "han@example.com", role: "用户", status: "active", createdAt: "2026-06-29T09:12:00Z" },
  { id: "u-1010", name: "吴勇", email: "wu@example.com", role: "管理员", status: "active", createdAt: "2026-06-28T23:50:00Z" },
];

const ROLE_FILTERS = ["全部", "用户", "创作者", "管理员"] as const;
type RoleFilter = (typeof ROLE_FILTERS)[number];

const PAGE_SIZE = 8;

export default function AdminUsersPage() {
  const [query, setQuery] = React.useState("");
  const [role, setRole] = React.useState<RoleFilter>("全部");
  const [page, setPage] = React.useState(1);

  const filtered = React.useMemo(() => {
    return ALL_USERS.filter((u) => {
      const matchRole = role === "全部" || u.role === role;
      const q = query.trim().toLowerCase();
      const matchQuery =
        q === "" ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      return matchRole && matchQuery;
    });
  }, [query, role]);

  React.useEffect(() => {
    setPage(1);
  }, [query, role]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: Column<AdminUser>[] = [
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
            u.role === "管理员"
              ? "bg-ink-950 text-white dark:bg-ink-100 dark:text-ink-950"
              : u.role === "创作者"
                ? "bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200"
                : "border border-ink-200 text-ink-500 dark:border-ink-700 dark:text-ink-400",
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
    {
      key: "actions",
      header: "操作",
      className: "text-right",
      cell: (u) =>
        u.role === "管理员" ? (
          <span className="text-xs text-ink-400">—</span>
        ) : (
          <button
            type="button"
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-all",
              u.status === "active"
                ? "border border-ink-200/60 bg-white/55 text-ink-700 backdrop-blur-xl hover:bg-white/72 hover:text-ink-950 dark:border-ink-700/60 dark:bg-white/5 dark:text-ink-200 dark:hover:bg-white/10 dark:hover:text-ink-50"
                : "bg-ink-950 text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)] hover:bg-ink-800 dark:bg-ink-100 dark:text-ink-950 dark:hover:bg-ink-200",
            )}
          >
            {u.status === "active" ? (
              <>
                <UserX className="h-3.5 w-3.5" />
                封禁
              </>
            ) : (
              <>
                <UserCheck className="h-3.5 w-3.5" />
                解封
              </>
            )}
          </button>
        ),
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-[-0.02em] text-ink-950 dark:text-ink-50">
          用户管理
        </h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          管理平台用户、创作者与管理员账号
        </p>
      </div>

      {/* 工具栏：搜索 + 筛选 - 玻璃胶囊 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索用户名或邮箱…"
            className="h-11 rounded-full border-white/70 bg-white/55 pl-11 pr-11 text-base backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/10"
          />
          {query ? (
            <button
              type="button"
              aria-label="清除"
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 transition-colors hover:text-ink-950 dark:hover:text-ink-50"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="inline-flex gap-1 rounded-full border border-white/40 bg-white/55 p-1 backdrop-blur-xl backdrop-saturate-150 dark:border-white/5 dark:bg-white/5">
          {ROLE_FILTERS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition-all",
                role === r
                  ? "bg-ink-950 text-white shadow-sm dark:bg-ink-100 dark:text-ink-950"
                  : "text-ink-500 hover:text-ink-950 dark:text-ink-400 dark:hover:text-ink-50",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={pageData}
        rowKey={(u) => u.id}
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          total,
          onPageChange: (p) => setPage(Math.min(Math.max(1, p), totalPages)),
        }}
      />
    </div>
  );
}
