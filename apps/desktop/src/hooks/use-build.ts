"use client";

import { useCallback, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@lynxkit/ui-web";
import { useBuildStore } from "@lynxkit/store";
import { buildApi, agentApi } from "@/lib/api";
import type { AgentStreamEvent } from "@lynxkit/api-client";
import type {
  BuildSession,
  ProductType,
  AgentLog,
} from "@lynxkit/shared";

/**
 * 构建 Hook
 *
 * 封装构建会话生命周期：创建（灵感输入）→ 配置 → 启动 → SSE 流式订阅 Agent 进度。
 * 状态写入 @lynxkit/store 的 build-store，组件订阅渲染。
 */
export function useBuild() {
  const {
    currentSession,
    sessions,
    logs,
    currentAgent,
    progress,
    isBuilding,
    pendingInspiration,
    selectedProductType,
    clarificationAnswers,
    generatedFiles,
    setInspiration,
    setProductType,
    setAnswers,
    startBuild,
    updateStatus,
    appendLog,
    setCurrentAgent,
    setGeneratedFiles,
    reset,
  } = useBuildStore();

  const streamingRef = useRef<AbortController | null>(null);

  /** 创建构建会话（首页"开始构建"） */
  const createMutation = useMutation({
    mutationFn: (input: {
      productType: ProductType;
      userInput: string;
      skipClarify?: boolean;
    }) => buildApi.create(input),
    onSuccess: (session) => {
      startBuild(session);
    },
  });

  /** 更新配置（澄清表单提交） */
  const updateConfigMutation = useMutation({
    mutationFn: ({
      sessionId,
      patch,
      confirmClarify,
    }: {
      sessionId: string;
      patch: Record<string, unknown>;
      confirmClarify?: boolean;
    }) => buildApi.updateConfig(sessionId, { patch, confirmClarify }),
    onSuccess: (session) => {
      updateStatus(session.status);
    },
  });

  /** 启动构建 + SSE 订阅 Agent 流式进度 */
  const startBuildFlow = useCallback(
    async (sessionId: string) => {
      await buildApi.start(sessionId);
      updateStatus("developing" as never, 5);

      // 中止上一次订阅
      streamingRef.current?.abort();
      const controller = new AbortController();
      streamingRef.current = controller;

      try {
        for await (const raw of buildApi.streamAgent(sessionId)) {
          if (controller.signal.aborted) break;
          let event: AgentStreamEvent | null = null;
          try {
            event = JSON.parse(raw) as AgentStreamEvent;
          } catch {
            // 非 JSON 的纯文本日志
            appendLog({
              id: crypto.randomUUID(),
              sessionId,
              agent: "frontend",
              level: "info",
              message: raw,
              createdAt: new Date().toISOString(),
            } as AgentLog);
            continue;
          }
          if (!event) continue;

          if (event.agent) setCurrentAgent(event.agent as never);
          if (event.type === "log" || event.type === "token") {
            appendLog({
              id: crypto.randomUUID(),
              sessionId,
              agent: (event.agent ?? "frontend") as never,
              level: event.type === "error" ? "error" : "info",
              message: event.data,
              createdAt: event.timestamp ?? new Date().toISOString(),
            } as AgentLog);
          } else if (event.type === "done") {
            updateStatus("deployed" as never, 100);
            toast({ title: "构建完成 🎉", variant: "success" });
          } else if (event.type === "error") {
            updateStatus("error" as never);
            toast({
              title: "构建失败",
              description: event.data,
              variant: "destructive",
            });
          }
        }
      } catch {
        // 流中断（网络 / 取消），静默处理
      }
    },
    [appendLog, setCurrentAgent, updateStatus],
  );

  /** 拉取历史日志 */
  const loadLogs = useCallback(
    async (sessionId: string) => {
      const history = await buildApi.getLogs(sessionId);
      for (const log of history) appendLog(log);
      return history;
    },
    [appendLog],
  );

  /** 拉取会话列表 */
  const listSessions = useCallback(async () => {
    const list = await buildApi.list();
    useBuildStore.setState({ sessions: list });
    return list;
  }, []);

  /** 拉取单个会话 */
  const loadSession = useCallback(async (id: string) => {
    const session: BuildSession = await buildApi.getById(id);
    startBuild(session);
    if (session.generatedCode?.files) {
      setGeneratedFiles(
        session.generatedCode.files.map((f) => ({
          path: f.path,
          content: f.content,
          language: f.language,
        })),
      );
    }
    return session;
  }, [startBuild, setGeneratedFiles]);

  return {
    // state
    currentSession,
    sessions,
    logs,
    currentAgent,
    progress,
    isBuilding,
    pendingInspiration,
    selectedProductType,
    clarificationAnswers,
    generatedFiles,
    // actions
    setInspiration,
    setProductType,
    setAnswers,
    createBuild: createMutation.mutateAsync,
    updateConfig: updateConfigMutation.mutateAsync,
    startBuildFlow,
    loadLogs,
    listSessions,
    loadSession,
    reset,
    isCreating: createMutation.isPending,
    isUpdating: updateConfigMutation.isPending,
  };
}
