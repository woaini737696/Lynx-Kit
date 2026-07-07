import { useBuild } from "@/hooks/use-build";
import { formatDateTime } from "@/lib/utils";
import type { AgentLog, AgentRole, BuildStatus } from "@lynxkit/shared";
import { Badge, Button, Skeleton, toast } from "@lynxkit/ui-web";
import {
	ArrowLeft,
	CheckCircle2,
	Cpu,
	Eye,
	FileCode2,
	Loader2,
	Play,
	Rocket,
	Settings2,
	Square,
	Terminal,
} from "lucide-react";
import * as React from "react";
import { Link, useParams } from "react-router-dom";

/** 9 层 Agent 角色映射 */
const AGENT_META: Record<AgentRole, { name: string; step: number }> = {
	intent: { name: "意图识别", step: 1 },
	architect: { name: "架构师", step: 2 },
	clarify: { name: "需求澄清", step: 3 },
	pm: { name: "产品经理", step: 4 },
	designer: { name: "设计师", step: 5 },
	frontend: { name: "前端开发", step: 6 },
	backend: { name: "后端开发", step: 7 },
	ai_int: { name: "AI 集成", step: 8 },
	test: { name: "测试修复", step: 9 },
	deploy: { name: "部署发布", step: 10 },
};

/** 状态对应进度百分比 */
const STATUS_PROGRESS: Record<BuildStatus, number> = {
	DRAFT: 5,
	CLARIFYING: 15,
	ARCHITECTING: 30,
	DEVELOPING: 60,
	TESTING: 80,
	DEPLOYING: 90,
	DEPLOYED: 100,
	ERROR: 100,
};

/**
 * 构建控制台
 *
 * - 顶部：会话信息 + 当前 Agent + 进度条
 * - 中部：日志流（实时滚动）+ Agent 步骤列表
 * - 底部：跳转配置 / 预览 / 部署
 */
export default function BuildConsolePage() {
	const params = useParams<{ sessionId: string }>();
	const sessionId = params.sessionId!;
	const {
		currentSession,
		logs,
		currentAgent,
		progress,
		isBuilding,
		loadSession,
		loadLogs,
		startBuildFlow,
		cancelBuild,
		reset,
	} = useBuild();

	const [loading, setLoading] = React.useState(true);
	const [starting, setStarting] = React.useState(false);
	const [cancelling, setCancelling] = React.useState(false);
	const logEndRef = React.useRef<HTMLDivElement>(null);

	// 加载会话详情 + 历史日志
	React.useEffect(() => {
		let cancelled = false;
		setLoading(true);
		Promise.all([loadSession(sessionId), loadLogs(sessionId)])
			.catch((e) => {
				toast({
					title: "加载会话失败",
					description: e instanceof Error ? e.message : String(e),
					variant: "destructive",
				});
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
			reset();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sessionId]);

	// 日志自动滚动到底部
	React.useEffect(() => {
		logEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [logs]);

	const onStart = async () => {
		setStarting(true);
		try {
			await startBuildFlow(sessionId);
		} catch (e) {
			toast({
				title: "启动构建失败",
				description: e instanceof Error ? e.message : String(e),
				variant: "destructive",
			});
		} finally {
			setStarting(false);
		}
	};

	const onCancel = async () => {
		if (!confirm("确认取消当前构建？已生成的进度将被标记为失败。")) return;
		setCancelling(true);
		try {
			await cancelBuild(sessionId);
		} finally {
			setCancelling(false);
		}
	};

	if (loading) {
		return (
			<div className="mx-auto max-w-6xl px-6 py-8">
				<Skeleton className="mb-4 h-24 w-full rounded-card" />
				<Skeleton className="h-96 w-full rounded-card" />
			</div>
		);
	}

	if (!currentSession) {
		return (
			<div className="px-6 py-20 text-center text-ink-500 dark:text-ink-400">
				会话不存在或已被删除
			</div>
		);
	}

	const status = currentSession.status;
	const progressPct = isBuilding ? progress : (STATUS_PROGRESS[status] ?? 0);
	const agentMeta = currentAgent ? AGENT_META[currentAgent] : null;

	return (
		<div className="mx-auto max-w-6xl px-6 py-6">
			{/* 顶部：标题与操作 */}
			<div className="mb-4 flex items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<Link to="/build">
						<Button variant="ghost" size="sm">
							<ArrowLeft className="mr-1.5 h-4 w-4" />
							返回列表
						</Button>
					</Link>
					<span className="text-sm text-ink-500 dark:text-ink-400">
						会话 {currentSession.id.slice(0, 8)}…
					</span>
				</div>
				<div className="flex items-center gap-2">
					<Link to={`/build/${sessionId}/configure`}>
						<Button
							variant="outline"
							size="sm"
							disabled={status !== "CLARIFYING" && status !== "DRAFT"}
						>
							<Settings2 className="mr-1.5 h-4 w-4" />
							配置
						</Button>
					</Link>
					<Link to={`/build/${sessionId}/preview`}>
						<Button
							variant="outline"
							size="sm"
							disabled={!currentSession.generatedCode}
						>
							<Eye className="mr-1.5 h-4 w-4" />
							预览
						</Button>
					</Link>
					<Link to={`/build/${sessionId}/deploy`}>
						<Button
							variant="outline"
							size="sm"
							disabled={status !== "DEPLOYED" && status !== "DEPLOYING"}
						>
							<Rocket className="mr-1.5 h-4 w-4" />
							部署
						</Button>
					</Link>
					{isBuilding ? (
						<Button
							variant="destructive"
							size="sm"
							onClick={() => void onCancel()}
							disabled={cancelling}
						>
							{cancelling ? (
								<Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
							) : (
								<Square className="mr-1.5 h-4 w-4" />
							)}
							{cancelling ? "取消中..." : "停止构建"}
						</Button>
					) : (
						<button
							className="btn-ink inline-flex items-center gap-1.5 text-sm disabled:opacity-50"
							onClick={() => void onStart()}
							disabled={starting || status === "DEPLOYED"}
						>
							{starting ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Play className="h-4 w-4" />
							)}
							{starting
								? "启动中..."
								: status === "DEPLOYED"
									? "已完成"
									: "启动构建"}
						</button>
					)}
				</div>
			</div>

			{/* 进度条 + 当前 Agent */}
			<div className="glass-card mb-4 p-5">
				<div className="flex items-center justify-between text-sm">
					<div className="flex items-center gap-2">
						<Cpu className="h-4 w-4 text-ink-900 dark:text-ink-100" />
						<span className="font-medium text-ink-900 dark:text-ink-100">
							{agentMeta
								? `Agent #${agentMeta.step} ${agentMeta.name}`
								: "等待启动"}
						</span>
						<Badge variant="outline" className="text-[10px]">
							{currentSession.productType}
						</Badge>
						<Badge variant="outline" className="text-[10px]">
							v{currentSession.version}
						</Badge>
					</div>
					<span className="text-xs text-ink-500 dark:text-ink-400">
						{formatDateTime(currentSession.updatedAt)}
					</span>
				</div>
				<div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800">
					<div
						className="h-full bg-ink-950 transition-all duration-300 dark:bg-ink-100"
						style={{ width: `${progressPct}%` }}
					/>
				</div>
				<div className="mt-2 flex justify-between text-xs text-ink-500 dark:text-ink-400">
					<span>进度 {progressPct}%</span>
					<span>状态：{status}</span>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				{/* Agent 步骤列表 */}
				<div className="glass-card lg:col-span-1">
					<div className="border-b border-ink-200/60 p-4 dark:border-ink-800/60">
						<div className="flex items-center gap-2 text-sm font-semibold text-ink-900 dark:text-ink-100">
							<Terminal className="h-4 w-4" />
							Agent 流水线
						</div>
						<p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
							10 步 Agent 串行执行
						</p>
					</div>
					<div className="p-4">
						<ol className="space-y-1.5 text-sm">
							{(Object.keys(AGENT_META) as AgentRole[]).map((role) => {
								const m = AGENT_META[role];
								const isActive = currentAgent === role;
								const isDone =
									currentSession.architecture && role === "architect"
										? true
										: currentSession.generatedCode &&
												["frontend", "backend", "ai_int"].includes(role)
											? true
											: status === "DEPLOYED" && role === "deploy";
								return (
									<li
										key={role}
										className={
											"flex items-center justify-between rounded-md px-2 py-1.5 transition-all duration-200 " +
											(isActive
												? "bg-ink-950 text-ink-0 dark:bg-ink-100 dark:text-ink-950"
												: "text-ink-700 dark:text-ink-300")
										}
									>
										<span className="flex items-center gap-2">
											<span
												className={
													"text-xs tabular-nums " +
													(isActive
														? "text-ink-300 dark:text-ink-500"
														: "text-ink-400 dark:text-ink-500")
												}
											>
												{m.step.toString().padStart(2, "0")}
											</span>
											<span>{m.name}</span>
										</span>
										{isActive ? (
											<Loader2 className="h-3 w-3 animate-spin" />
										) : isDone ? (
											<CheckCircle2 className="h-3.5 w-3.5 text-ink-500 dark:text-ink-400" />
										) : null}
									</li>
								);
							})}
						</ol>
					</div>
				</div>

				{/* 日志流（终端样式） */}
				<div className="glass-card lg:col-span-2">
					<div className="border-b border-ink-200/60 p-4 dark:border-ink-800/60">
						<div className="flex items-center gap-2 text-sm font-semibold text-ink-900 dark:text-ink-100">
							<FileCode2 className="h-4 w-4" />
							实时日志
							<Badge variant="outline" className="ml-1 text-[10px]">
								{logs.length} 条
							</Badge>
						</div>
					</div>
					<div className="p-4">
						<div className="h-[420px] overflow-y-auto rounded-lg bg-ink-950 p-3 font-mono text-xs leading-5 text-ink-100">
							{logs.length === 0 ? (
								<div className="flex h-full items-center justify-center text-ink-500">
									{isBuilding ? "等待 Agent 输出..." : "点击「启动构建」开始"}
								</div>
							) : (
								logs.map((log: AgentLog) => (
									<div key={log.id} className="flex gap-2 py-0.5">
										<span className="shrink-0 text-ink-500">
											{new Date(log.createdAt).toLocaleTimeString()}
										</span>
										<span
											className={
												"shrink-0 font-semibold " +
												(log.level === "ERROR"
													? "text-red-400"
													: log.level === "WARN"
														? "text-yellow-400"
														: "text-ink-300")
											}
										>
											[{log.agent}]
										</span>
										<span className="whitespace-pre-wrap break-all text-ink-100">
											{log.message}
										</span>
									</div>
								))
							)}
							<div ref={logEndRef} />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
