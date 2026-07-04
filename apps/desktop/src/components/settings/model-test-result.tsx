"use client";

import * as React from "react";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
} from "lucide-react";
import { Badge } from "@lynxkit/ui-web";
import { cn } from "@/lib/utils";
import type { ProviderTestState } from "@/hooks/use-ai-config";
import type { TestAiModelResult } from "@lynxkit/api-client";

interface ModelTestResultProps {
  state: ProviderTestState;
  result?: TestAiModelResult;
  className?: string;
}

/**
 * 连通性测试结果展示
 *
 * 状态指示器：已配置 / 未配置 / 测试中 / 失败 + 耗时 + 示例响应。
 */
export function ModelTestResult({
  state,
  result,
  className,
}: ModelTestResultProps) {
  if (state === "idle") {
    return (
      <Badge variant="outline" className="border-ink-200 text-ink-500 dark:border-ink-700 dark:text-ink-400">
        未测试
      </Badge>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
        state === "testing" && "border-ink-300 bg-ink-100/60 text-ink-700 dark:border-ink-700 dark:bg-ink-800/60 dark:text-ink-300",
        state === "success" && "border-ink-950/20 bg-ink-100/60 text-ink-950 dark:border-ink-100/20 dark:bg-ink-900/60 dark:text-ink-100",
        state === "failed" && "border-destructive/30 bg-destructive/5 text-destructive",
        className,
      )}
    >
      {state === "testing" && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          测试中...
        </>
      )}
      {state === "success" && (
        <>
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>已连通</span>
          {result?.latencyMs && (
            <span className="inline-flex items-center gap-0.5 opacity-80">
              <Clock className="h-3 w-3" />
              {result.latencyMs}ms
            </span>
          )}
        </>
      )}
      {state === "failed" && (
        <>
          <XCircle className="h-3.5 w-3.5" />
          <span className="truncate" title={result?.error}>
            {result?.error ?? "测试失败"}
          </span>
        </>
      )}
    </div>
  );
}

/** 已配置状态徽标 */
export function ConfiguredBadge() {
  return (
    <Badge className="bg-ink-950 text-ink-0 dark:bg-ink-100 dark:text-ink-950">
      <Zap className="mr-1 h-3 w-3" />
      已配置
    </Badge>
  );
}
