"use client";

import { agentApi, buildApi } from "@/lib/api";
import type { AgentStreamEvent } from "@lynxkit/api-client";
import type { AgentLog, BuildSession, ProductType } from "@lynxkit/shared";
import { useBuildStore } from "@lynxkit/store";
import { toast } from "@lynxkit/ui-web";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useRef } from "react";

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
							level: "INFO",
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
							level: "INFO",
							message: event.data,
							createdAt: event.timestamp ?? new Date().toISOString(),
						} as AgentLog);
					} else if (event.type === "done") {
						updateStatus("DEPLOYED" as never, 100);
						toast({ title: "构建完成 🎉", variant: "success" });
					} else if (event.type === "error") {
						updateStatus("ERROR" as never);
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

	/**
	 * 取消构建：调用后端 cancel 接口 + 中止 SSE 流
	 *
	 * 后端会把会话状态更新为 ERROR，前端通过 abort controller
	 * 主动断开 streamAgent 的长连接，避免悬空 fetch。
	 */
	const cancelBuild = useCallback(
		async (sessionId: string) => {
			// 1. 中止 SSE 流（必须在 API 调用前，避免 race）
			streamingRef.current?.abort();
			streamingRef.current = null;

			// 2. 调用后端 cancel 接口
			try {
				await buildApi.cancel(sessionId);
				updateStatus("error" as never);
				toast({ title: "已取消构建", variant: "default" });
			} catch (e) {
				toast({
					title: "取消构建失败",
					description: e instanceof Error ? e.message : String(e),
					variant: "destructive",
				});
			}
		},
		[updateStatus],
	);

	/** 拉取会话列表 */
	const listSessions = useCallback(async () => {
		const list = await buildApi.list();
		useBuildStore.setState({ sessions: list });
		return list;
	}, []);

	/** 拉取单个会话 */
	const loadSession = useCallback(
		async (id: string) => {
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
		},
		[startBuild, setGeneratedFiles],
	);

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
		cancelBuild,
		loadLogs,
		listSessions,
		loadSession,
		reset,
		isCreating: createMutation.isPending,
		isUpdating: updateConfigMutation.isPending,
	};
}
