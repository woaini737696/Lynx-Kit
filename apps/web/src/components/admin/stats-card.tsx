import * as React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 统计卡片 - iOS26 毛玻璃质感
 *
 * 用于管理后台仪表盘：展示单个指标数值 + 同比趋势。
 * change > 0 显示上升（黑色），< 0 显示下降（灰色）。
 */
interface StatsCardProps {
  title: string;
  value: string | number;
  /** 同比变化百分比（正数上升，负数下降） */
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}

export function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  className,
}: StatsCardProps) {
  const trend: "up" | "down" | null =
    change === undefined ? null : change >= 0 ? "up" : "down";

  return (
    <div
      className={cn(
        "glow-card flex flex-col gap-2 p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.06em] text-ink-500 dark:text-ink-400">
          {title}
        </p>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-950 text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)] dark:bg-ink-100 dark:text-ink-950">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-[-0.03em] text-ink-950 dark:text-ink-50">
          {value}
        </span>
        {trend ? (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-semibold",
              trend === "up"
                ? "text-ink-950 dark:text-ink-50"
                : "text-ink-500 dark:text-ink-400",
            )}
          >
            {trend === "up" ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {Math.abs(change as number)}%
          </span>
        ) : null}
      </div>
    </div>
  );
}
