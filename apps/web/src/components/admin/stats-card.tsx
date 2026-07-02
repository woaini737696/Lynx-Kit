import * as React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent } from "@lynxkit/ui-web";
import { cn } from "@/lib/utils";

/**
 * 统计卡片
 *
 * 用于管理后台仪表盘：展示单个指标数值 + 同比趋势。
 * change > 0 显示绿色上升，< 0 显示红色下降。
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
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-lynx-500/10 text-lynx-600 dark:text-lynx-400">
            <Icon className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight">{value}</span>
          {trend ? (
            <span
              className={cn(
                "flex items-center text-xs font-medium",
                trend === "up"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400",
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
      </CardContent>
    </Card>
  );
}
