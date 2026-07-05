"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface AuditEntry {
  type: string;
  id: string;
  action: string;
  timestamp: string;
}

interface AuditResp {
  list: AuditEntry[];
  total: number;
}

const typeLabels: Record<string, string> = {
  user: "用户",
  build: "构建",
  product: "产品",
};

const typeColors: Record<string, string> = {
  user: "bg-ink-200 text-ink-700",
  build: "bg-ink-800 text-white",
  product: "bg-ink-300 text-ink-800",
};

export default function AuditPage() {
  const [list, setList] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi
      .getAudit({ page: 1, pageSize: 50 })
      .then((data) => setList((data as AuditResp).list))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-ink-400">加载中...</div>;
  if (error) return <div className="rounded-lg bg-red-50 p-4 text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-950">审计日志</h1>
        <p className="mt-1 text-sm text-ink-500">最近 50 条操作记录</p>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-200 bg-ink-50/60 text-left text-xs text-ink-500">
              <th className="px-4 py-3 font-medium">类型</th>
              <th className="px-4 py-3 font-medium">对象 ID</th>
              <th className="px-4 py-3 font-medium">操作</th>
              <th className="px-4 py-3 font-medium">时间</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-ink-400">
                  暂无审计日志
                </td>
              </tr>
            ) : (
              list.map((entry, i) => (
                <tr
                  key={`${entry.id}-${i}`}
                  className="border-b border-ink-100 transition-colors hover:bg-ink-50"
                >
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        typeColors[entry.type] ?? "bg-ink-200 text-ink-700"
                      }`}
                    >
                      {typeLabels[entry.type] ?? entry.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-600">
                    {entry.id.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3 text-ink-700">{entry.action}</td>
                  <td className="px-4 py-3 text-xs text-ink-400">
                    {formatDate(entry.timestamp)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
