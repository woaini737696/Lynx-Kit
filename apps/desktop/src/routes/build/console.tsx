import * as React from "react";
import { useParams, Link } from "react-router-dom";
import {
  Terminal,
  Play,
  Square,
  ArrowLeft,
  Settings2,
  Eye,
  Rocket,
  Loader2,
  Cpu,
  FileCode2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Skeleton,
  toast,
} from "@lynxkit/ui-web";
import { useBuild } from "@/hooks/use-build";
import { formatDateTime } from "@/lib/utils";
import type { BuildStatus, AgentRole, AgentLog } from "@lynxkit/shared";

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
  draft: 5,
  clarifying: 15,
  architecting: 30,
  developing: 60,
  testing: 80,
  deploying: 90,
  deployed: 100,
  error: 100,
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
        <Skeleton className="mb-4 h-24 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className="px-6 py-20 text-center text-muted-foreground">
        会话不存在或已被删除
      </div>
    );
  }

  const status = currentSession.status;
  const progressPct = isBuilding ? progress : STATUS_PROGRESS[status] ?? 0;
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
          <span className="text-sm text-muted-foreground">
            会话 {currentSession.id.slice(0, 8)}…
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/build/${sessionId}/configure`}>
            <Button variant="outline" size="sm" disabled={status !== "clarifying" && status !== "draft"}>
              <Settings2 className="mr-1.5 h-4 w-4" />
              配置
            </Button>
          </Link>
          <Link to={`/build/${sessionId}/preview`}>
            <Button variant="outline" size="sm" disabled={!currentSession.generatedCode}>
              <Eye className="mr-1.5 h-4 w-4" />
              预览
            </Button>
          </Link>
          <Link to={`/build/${sessionId}/deploy`}>
            <Button variant="outline" size="sm" disabled={status !== "deployed" && status !== "deploying"}>
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
            <Button
              className="bg-lynx-500 text-white hover:bg-lynx-600"
              size="sm"
              onClick={() => void onStart()}
              disabled={starting || status === "deployed"}
            >
              {starting ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-1.5 h-4 w-4" />
              )}
              {starting ? "启动中..." : status === "deployed" ? "已完成" : "启动构建"}
            </Button>
          )}
        </div>
      </div>

      {/* 进度条 + 当前 Agent */}
      <Card className="mb-4">
        <CardContent className="p-5">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-lynx-500" />
              <span className="font-medium">
                {agentMeta ? `Agent #${agentMeta.step} ${agentMeta.name}` : "等待启动"}
              </span>
              <Badge variant="outline" className="text-[10px]">
                {currentSession.productType}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                v{currentSession.version}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDateTime(currentSession.updatedAt)}
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-gradient-to-r from-lynx-500 to-lynx-400 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>进度 {progressPct}%</span>
            <span>状态：{status}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Agent 步骤列表 */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Terminal className="h-4 w-4 text-lynx-500" />
              Agent 流水线
            </CardTitle>
            <CardDescription className="text-xs">
              10 步 Agent 串行执行
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
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
                      : status === "deployed" && role === "deploy";
                return (
                  <li
                    key={role}
                    className={
                      "flex items-center justify-between rounded-md px-2 py-1.5 " +
                      (isActive ? "bg-lynx-500/10 text-lynx-700" : "")
                    }
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {m.step.toString().padStart(2, "0")}
                      </span>
                      <span>{m.name}</span>
                    </span>
                    {isActive ? (
                      <Loader2 className="h-3 w-3 animate-spin text-lynx-500" />
                    ) : isDone ? (
                      <span className="text-xs text-green-600">✓</span>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>

        {/* 日志流 */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileCode2 className="h-4 w-4 text-lynx-500" />
              实时日志
              <Badge variant="outline" className="ml-1 text-[10px]">
                {logs.length} 条
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[420px] overflow-y-auto rounded-md bg-slate-950 p-3 font-mono text-xs leading-5 text-slate-200">
              {logs.length === 0 ? (
                <div className="flex h-full items-center justify-center text-slate-500">
                  {isBuilding ? "等待 Agent 输出..." : "点击「启动构建」开始"}
                </div>
              ) : (
                logs.map((log: AgentLog) => (
                  <div key={log.id} className="flex gap-2 py-0.5">
                    <span className="shrink-0 text-slate-500">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                    <span
                      className={
                        "shrink-0 font-semibold " +
                        (log.level === "error"
                          ? "text-red-400"
                          : log.level === "warn"
                            ? "text-yellow-400"
                            : "text-lynx-400")
                      }
                    >
                      [{log.agent}]
                    </span>
                    <span className="whitespace-pre-wrap break-all text-slate-200">
                      {log.message}
                    </span>
                  </div>
                ))
              )}
              <div ref={logEndRef} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
