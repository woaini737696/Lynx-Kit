import * as React from "react";

import { Skeleton } from "../ui/Skeleton";

/**
 * 统计卡片组件
 * 用于仪表盘顶部展示关键指标
 */

export interface StatCardProps {
  title: string;
  value: React.ReactNode;
  /** 与上一周期对比的变化百分比，正数表示增长 */
  change?: number;
  /** 变化对比的描述（例如：vs 上周） */
  changeLabel?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  /** 自定义强调色（hex / tailwind class） */
  accent?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  loading = false,
  accent = "#3B82F6",
}: StatCardProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <Skeleton variant="text" width={80} />
        <div className="mt-3">
          <Skeleton variant="text" width={120} height={28} />
        </div>
        <div className="mt-2">
          <Skeleton variant="text" width={60} />
        </div>
      </div>
    );
  }

  const isPositive = typeof change === "number" && change >= 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div className="text-sm text-gray-500">{title}</div>
        {icon && (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-md"
            style={{ backgroundColor: `${accent}1A`, color: accent }}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="mt-2 text-2xl font-semibold text-gray-900">
        {value}
      </div>
      {typeof change === "number" && (
        <div className="mt-1 flex items-center gap-1 text-xs">
          <span
            className={
              isPositive ? "text-green-600" : "text-red-600"
            }
          >
            {isPositive ? "▲" : "▼"} {Math.abs(change)}%
          </span>
          {changeLabel && (
            <span className="text-gray-400">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
