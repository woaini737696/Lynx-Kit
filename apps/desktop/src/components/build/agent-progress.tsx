"use client";

import * as React from "react";
import {
  CheckCircle2,
  Loader2,
  Circle,
  Clock,
  Terminal,
} from "lucide-react";
import { Card, CardContent, Progress, ScrollArea, Badge } from "@lynxkit/ui-web";
import { cn, formatDateTime } from "@/lib/utils";
import { useBuild } from "@/hooks/use-build";
import { AGENTS, getAgentMeta } from "@lynxkit/shared";
import type { AgentRole } from "@lynxkit/shared";

type StepStatus = "waiting" | "running" | "done" | "error";

interface AgentProgressProps {
  /** 当前会话 ID */
  sessionId: string;
  /** 是否自动启动流式订阅 */
  autoStart?: boolean;
  className?: string;
}

/**
 * Agent 进度流
 *
 * SSE 流式订阅 9 层 Agent 进度：
 * - 10 个 Agent 状态卡片（等待 / 进行中 / 完成 / 错误）
 * - 总进度条
 * - 实时日志流
 */
export function AgentProgress({
  sessionId,
  autoStart = false,
  className,
}: AgentProgressProps) {
  const {
    logs,
    currentAgent,
    progress,
    isBuilding,
    startBuildFlow,
    loadLogs,
  } = useBuild();

  // 挂载时拉取历史日志；可选启动流
  React.useEffect(() => {
    void loadLogs(sessionId);
    if (autoStart) {
      void startBuildFlow(sessionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const currentStep = currentAgent
    ? getAgentMeta(currentAgent as AgentRole)?.step ?? 0
    : 0;

  const stepStatus = (step: number): StepStatus => {
    if (currentAgent && step === currentStep) {
      return "running";
    }
    if (currentStep > step || progress >= 100) {
      return "done";
    }
    return "waiting";
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* 进度总览 */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isBuilding ? (
                <Loader2 className="h-4 w-4 animate-spin text-lynx-500" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">
                {progress >= 100 ? "构建完成" : isBuilding ? "构建中" : "待启动"}
              </span>
            </div>
            <span className="text-sm tabular-nums text-muted-foreground">
              {progress}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* 9 层 Agent 状态卡片 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {AGENTS.map((agent) => {
          const status = stepStatus(agent.step);
          return (
            <div
              key={agent.id}
              className={cn(
                "rounded-lg border p-2.5 transition",
                status === "running" && "border-lynx-500 bg-lynx-500/5",
                status === "done" && "border-green-500/30 bg-green-500/5",
                status === "waiting" && "border-border opacity-60",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-muted-foreground">
                  {agent.step}
                </span>
                <StatusIcon status={status} />
              </div>
              <div className="mt-1 truncate text-xs font-medium" title={agent.name}>
                {agent.name.replace(" Agent", "")}
              </div>
            </div>
          );
        })}
      </div>

      {/* 实时日志流 */}
      <Card>
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Terminal className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">实时日志</span>
          <Badge variant="outline" className="ml-auto text-[10px]">
            {logs.length} 条
          </Badge>
        </div>
        <ScrollArea className="h-[260px]">
          <div className="space-y-1 p-3 font-mono text-xs">
            {logs.length === 0 ? (
              <p className="text-muted-foreground">等待日志输出...</p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={cn(
                    "flex gap-2",
                    log.level === "error" && "text-destructive",
                    log.level === "warn" && "text-yellow-500",
                    log.level === "debug" && "text-muted-foreground",
                  )}
                >
                  <span className="shrink-0 text-muted-foreground">
                    {formatDateTime(log.createdAt).slice(11)}
                  </span>
                  <Badge variant="outline" className="shrink-0 text-[9px] font-normal">
                    {log.agent}
                  </Badge>
                  <span className="whitespace-pre-wrap break-all">
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}

function StatusIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case "done":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "running":
      return <Loader2 className="h-4 w-4 animate-spin text-lynx-500" />;
    case "error":
      return <CheckCircle2 className="h-4 w-4 text-destructive" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground/50" />;
  }
}
