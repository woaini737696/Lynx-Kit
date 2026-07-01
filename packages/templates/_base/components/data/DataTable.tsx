import * as React from "react";

import { Skeleton } from "../ui/Skeleton";

/**
 * 数据表格组件
 * 支持：CRUD 行操作 / 列筛选 / 列排序 / 服务端/前端分页
 */

export interface DataTableColumn<T> {
  key: string;
  title: React.ReactNode;
  dataIndex?: keyof T;
  render?: (record: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: React.CSSProperties["width"];
  align?: "left" | "center" | "right";
}

export interface DataTableProps<T extends { id: string | number }> {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  rowKey?: keyof T;
  pageSize?: number;
  total?: number;
  current?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (record: T) => void;
  rowActions?: (record: T) => React.ReactNode;
  empty?: React.ReactNode;
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  loading = false,
  pageSize = 10,
  total,
  current,
  onPageChange,
  onRowClick,
  rowActions,
  empty,
}: DataTableProps<T>) {
  const [innerPage, setInnerPage] = React.useState(1);
  const [sortKey, setSortKey] = React.useState<string | undefined>();
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");

  const page = current ?? innerPage;
  const totalRecords = total ?? data.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  const sortedData = React.useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.dataIndex) return data;
    const copy = [...data];
    copy.sort((a, b) => {
      const av = a[col.dataIndex as keyof T];
      const bv = b[col.dataIndex as keyof T];
      if (av === bv) return 0;
      const result = av > bv ? 1 : -1;
      return sortDir === "asc" ? result : -result;
    });
    return copy;
  }, [data, sortKey, sortDir, columns]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handlePageChange = (next: number) => {
    const clamped = Math.max(1, Math.min(totalPages, next));
    if (current === undefined) setInnerPage(clamped);
    onPageChange?.(clamped);
  };

  const alignClass = (align?: "left" | "center" | "right") =>
    align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";

  return (
    <div className="w-full overflow-hidden rounded-md border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={[
                    "px-3 py-2 font-medium text-gray-600",
                    alignClass(col.align),
                  ].join(" ")}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-gray-900"
                    >
                      {col.title}
                      <span className="text-xs">
                        {sortKey === col.key
                          ? sortDir === "asc"
                            ? "▲"
                            : "▼"
                          : "↕"
                        }
                      </span>
                    </button>
                  ) : (
                    col.title
                  )}
                </th>
              ))}
              {rowActions && <th className="px-3 py-2 text-right">操作</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-3 py-3">
                      <Skeleton variant="text" />
                    </td>
                  ))}
                  {rowActions && (
                    <td className="px-3 py-3">
                      <Skeleton variant="text" width={60} />
                    </td>
                  )}
                </tr>
              ))
            ) : sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (rowActions ? 1 : 0)}
                  className="px-3 py-10 text-center text-gray-400"
                >
                  {empty ?? "暂无数据"}
                </td>
              </tr>
            ) : (
              sortedData.map((record, index) => (
                <tr
                  key={record.id}
                  onClick={onRowClick ? () => onRowClick(record) : undefined}
                  className={[
                    "hover:bg-gray-50",
                    onRowClick ? "cursor-pointer" : "",
                  ].join(" ")}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={[
                        "px-3 py-2 text-gray-800",
                        alignClass(col.align),
                      ].join(" ")}
                    >
                      {col.render
                        ? col.render(record, index)
                        : col.dataIndex
                          ? String(record[col.dataIndex as keyof T] ?? "")
                          : null}
                    </td>
                  ))}
                  {rowActions && (
                    <td
                      className="px-3 py-2 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end gap-1">
                        {rowActions(record)}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-3 py-2 text-sm text-gray-600">
          <span>
            共 {totalRecords} 条 · 第 {page}/{totalPages} 页
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="rounded-md border border-gray-200 px-3 py-1 disabled:opacity-50"
            >
              上一页
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="rounded-md border border-gray-200 px-3 py-1 disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
