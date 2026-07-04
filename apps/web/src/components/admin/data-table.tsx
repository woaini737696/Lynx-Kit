"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 通用数据表格 - iOS26 毛玻璃质感
 *
 * - 列定义支持自定义渲染与排序（sortable + sortValue）
 * - 可选分页（pagination 受控）
 * - 暗色模式适配
 */
export interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  className?: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  pagination?: Pagination;
  rowKey?: (row: T, index: number) => string;
  empty?: React.ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  pagination,
  rowKey,
  empty,
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");

  const sortedData = React.useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.key === sortKey && c.sortable);
    if (!col?.sortValue) return data;
    const arr = [...data];
    arr.sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [data, sortKey, sortDir, columns]);

  function toggleSort(col: Column<T>) {
    if (!col.sortable) return;
    if (sortKey === col.key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(col.key);
      setSortDir("asc");
    }
  }

  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
    : 1;

  return (
    <div className={cn("w-full", className)}>
      <div className="overflow-x-auto rounded-2xl border border-white/40 bg-white/55 backdrop-blur-xl backdrop-saturate-150 dark:border-white/5 dark:bg-white/5">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-200/60 bg-white/40 dark:border-ink-800/60 dark:bg-white/5">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.06em] text-ink-500 dark:text-ink-400",
                    col.className,
                  )}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col)}
                      className="inline-flex items-center gap-1 transition-colors hover:text-ink-950 dark:hover:text-ink-50"
                    >
                      {col.header}
                      {sortKey === col.key ? (
                        sortDir === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3.5 w-3.5 text-ink-300 dark:text-ink-700" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-200/40 dark:divide-ink-800/60">
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-ink-500 dark:text-ink-400"
                >
                  {empty ?? "暂无数据"}
                </td>
              </tr>
            ) : (
              sortedData.map((row, i) => (
                <tr
                  key={rowKey ? rowKey(row, i) : i}
                  className="transition-colors hover:bg-white/72 dark:hover:bg-white/10"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-3 align-middle text-ink-700 dark:text-ink-200",
                        col.className,
                      )}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination ? (
        <div className="mt-3 flex items-center justify-between text-sm text-ink-500 dark:text-ink-400">
          <span>
            共 {pagination.total} 条 · 第 {pagination.page}/{totalPages} 页
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-ink-200/60 bg-white/55 text-ink-600 backdrop-blur-xl transition-colors hover:bg-white/72 hover:text-ink-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-ink-700/60 dark:bg-white/5 dark:text-ink-300 dark:hover:bg-white/10 dark:hover:text-ink-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={pagination.page >= totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-ink-200/60 bg-white/55 text-ink-600 backdrop-blur-xl transition-colors hover:bg-white/72 hover:text-ink-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-ink-700/60 dark:bg-white/5 dark:text-ink-300 dark:hover:bg-white/10 dark:hover:text-ink-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
