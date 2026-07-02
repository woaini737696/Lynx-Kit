"use client";

import * as React from "react";
import { Search, X, UserCheck, UserX } from "lucide-react";
import { Badge, Button, Input } from "@lynxkit/ui-web";
import { DataTable, type Column } from "@/components/admin/data-table";
import { cn, formatDateTime } from "@/lib/utils";

/**
 * 用户管理
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

const ROLE_VARIANT: Record<AdminUser["role"], "default" | "secondary" | "outline"> = {
  管理员: "default",
  创作者: "secondary",
  用户: "outline",
};

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
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-lynx-500 to-lynx-600 text-xs font-semibold text-white">
            {u.name.slice(0, 1)}
          </div>
          <div>
            <p className="font-medium">{u.name}</p>
            <p className="text-xs text-muted-foreground">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "角色",
      cell: (u) => <Badge variant={ROLE_VARIANT[u.role]}>{u.role}</Badge>,
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
    {
      key: "actions",
      header: "操作",
      className: "text-right",
      cell: (u) =>
        u.role === "管理员" ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : (
          <Button
            variant={u.status === "active" ? "outline" : "default"}
            size="sm"
            className={cn(
              "h-8 gap-1.5 text-xs",
              u.status === "active"
                ? ""
                : "bg-lynx-500 text-white hover:bg-lynx-600",
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
          </Button>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">用户管理</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          管理平台用户、创作者与管理员账号
        </p>
      </div>

      {/* 工具栏：搜索 + 筛选 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索用户名或邮箱…"
            className="h-10 pl-10 pr-10"
          />
          {query ? (
            <button
              type="button"
              aria-label="清除"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="inline-flex rounded-lg border border-border bg-muted p-1 text-sm">
          {ROLE_FILTERS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(
                "rounded-md px-3 py-1.5 transition",
                role === r
                  ? "bg-background font-medium shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
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
