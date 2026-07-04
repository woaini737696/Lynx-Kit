import * as React from "react";
import { useParams, Link } from "react-router-dom";
import {
  Settings2,
  ArrowLeft,
  Save,
  Loader2,
  Lock,
  CheckCircle2,
  ListChecks,
  ArrowRight,
  ArrowLeft as ChevronLeft,
} from "lucide-react";
import {
  Button,
  Badge,
  Label,
  Textarea,
  Skeleton,
  toast,
} from "@lynxkit/ui-web";
import { useBuild } from "@/hooks/use-build";
import { formatDateTime } from "@/lib/utils";
import type { ProductType } from "@lynxkit/shared";

/**
 * 按产品类型给出 mock 澄清问题
 *
 * 实际生产中由 ③ CLARIFY Agent 动态生成；MVP 阶段使用静态问题集，
 * 让用户在配置页可以填写并提交，体验完整流程。
 */
const CLARIFY_QUESTIONS: Record<
  ProductType,
  { id: string; label: string; placeholder: string; required?: boolean }[]
> = {
  social: [
    { id: "audience", label: "目标用户群体", placeholder: "如 18-25 岁都市白领", required: true },
    { id: "coreFeature", label: "核心社交玩法", placeholder: "如 兴趣匹配 + 匿名聊天", required: true },
    { id: "monetization", label: "商业化方式", placeholder: "如 会员订阅 / 虚拟礼物" },
  ],
  system: [
    { id: "scenario", label: "业务场景", placeholder: "如 企业内部审批中台", required: true },
    { id: "scale", label: "预期规模", placeholder: "如 1000 并发 / 10 万用户" },
    { id: "integration", label: "需要集成的系统", placeholder: "如 钉钉 / 企微 / 飞书" },
  ],
  workstation: [
    { id: "useCase", label: "主要使用场景", placeholder: "如 个人知识管理 + 写作", required: true },
    { id: "aiFeature", label: "需要的 AI 能力", placeholder: "如 文档摘要 / 翻译 / 续写" },
    { id: "storage", label: "数据存储偏好", placeholder: "如 本地优先 / 云同步" },
  ],
  data: [
    { id: "dataSource", label: "数据来源", placeholder: "如 MySQL / Excel / API", required: true },
    { id: "metrics", label: "核心指标", placeholder: "如 GMV / DAU / 留存" },
    { id: "visualization", label: "可视化偏好", placeholder: "如 折线图 / 漏斗 / 地图" },
  ],
  admin: [
    { id: "module", label: "管理模块", placeholder: "如 CRM + 客户管理", required: true },
    { id: "roles", label: "角色权限", placeholder: "如 管理员 / 运营 / 销售" },
    { id: "workflow", label: "审批流程", placeholder: "如 三级审核 / 自动通过" },
  ],
  app: [
    { id: "platform", label: "目标平台", placeholder: "如 微信小程序 + H5", required: true },
    { id: "coreFeature", label: "核心功能", placeholder: "如 任务打卡 + 排行榜", required: true },
    { id: "push", label: "消息推送方式", placeholder: "如 模板消息 / 短信" },
  ],
  marketing: [
    { id: "channel", label: "投放渠道", placeholder: "如 抖音 / 小红书 / 公众号", required: true },
    { id: "budget", label: "预算范围", placeholder: "如 1-5 万 / 月" },
    { id: "goal", label: "营销目标", placeholder: "如 获客 / 转化 / 品宣" },
  ],
  hardware: [
    { id: "device", label: "硬件类型", placeholder: "如 智能音箱 / 摄像头", required: true },
    { id: "protocol", label: "通信协议", placeholder: "如 MQTT / CoAP / WebSocket" },
    { id: "platform", label: "对接平台", placeholder: "如 涂鸦 / 阿里云 IoT" },
  ],
};

/**
 * 构建配置页
 *
 * - clarifying / draft 状态：可编辑澄清问题表单，提交后调用 updateConfig
 * - 其他状态：只读展示已提交的配置项
 *
 * 交互：每问一个问题，逐个回答，支持「上一题/下一题」与回车跳转。
 */
export default function ConfigurePage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId!;
  const { currentSession, loadSession, updateConfig, isUpdating, reset } = useBuild();

  const [loading, setLoading] = React.useState(true);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadSession(sessionId)
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

  // 从会话 config 回填已有答案
  React.useEffect(() => {
    if (!currentSession) return;
    const cfg = currentSession.config ?? {};
    const initial: Record<string, string> = {};
    for (const [k, v] of Object.entries(cfg)) {
      if (typeof v === "string") initial[k] = v;
    }
    setAnswers(initial);
  }, [currentSession]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <Skeleton className="mb-4 h-10 w-48 rounded-md" />
        <Skeleton className="mb-3 h-32 w-full rounded-card" />
        <Skeleton className="h-64 w-full rounded-card" />
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
  const editable = status === "clarifying" || status === "draft";
  const questions = CLARIFY_QUESTIONS[currentSession.productType] ?? [];
  const userInput =
    (currentSession.config?.userInput as string) ??
    (currentSession.config?.input as string) ??
    "(未命名需求)";

  const currentQuestion = questions[step];
  const isLast = step >= questions.length - 1;
  const progressPct = questions.length > 0
    ? Math.round(((step + (currentQuestion ? 1 : 0)) / questions.length) * 100)
    : 0;

  const onSubmit = async () => {
    // 简单校验必填项
    const missing = questions.filter((q) => q.required && !answers[q.id]?.trim());
    if (missing.length > 0) {
      toast({
        title: "请补充必填项",
        description: missing.map((m) => m.label).join("、"),
        variant: "destructive",
      });
      return;
    }
    try {
      await updateConfig({
        sessionId,
        patch: { ...answers, userInput },
        confirmClarify: true,
      });
      toast({ title: "配置已提交，开始架构设计", variant: "success" });
    } catch (e) {
      toast({
        title: "保存失败",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    }
  };

  const goNext = () => {
    if (!currentQuestion) return;
    if (currentQuestion.required && !answers[currentQuestion.id]?.trim()) {
      toast({
        title: "请填写必填项",
        description: currentQuestion.label,
        variant: "destructive",
      });
      return;
    }
    if (!isLast) setStep((s) => s + 1);
  };

  const goPrev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      {/* 顶部 */}
      <div className="mb-4 flex items-center gap-2">
        <Link to={`/build/${sessionId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            返回控制台
          </Button>
        </Link>
        <Settings2 className="h-5 w-5 text-ink-900 dark:text-ink-100" />
        <h1 className="text-lg font-semibold text-ink-950 dark:text-ink-0">配置</h1>
        <Badge variant={editable ? "default" : "secondary"} className="gap-1">
          {editable ? (
            <>
              <ListChecks className="h-3 w-3" />
              可编辑
            </>
          ) : (
            <>
              <Lock className="h-3 w-3" />
              只读
            </>
          )}
        </Badge>
        <Badge variant="outline" className="text-[10px]">
          {currentSession.productType}
        </Badge>
      </div>

      {/* 用户原始需求（只读） */}
      <div className="glass-card mb-4 p-5">
        <h2 className="mb-2 text-sm font-semibold text-ink-900 dark:text-ink-100">原始需求</h2>
        <p className="rounded bg-ink-100/60 px-3 py-2 text-sm text-ink-700 dark:bg-ink-900/60 dark:text-ink-300">
          {userInput}
        </p>
      </div>

      {/* 澄清问答交互 */}
      <div className="glass-card">
        {/* 头部 */}
        <div className="border-b border-ink-200/60 p-5 dark:border-ink-800/60">
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-ink-900 dark:text-ink-100" />
            <h2 className="text-sm font-semibold text-ink-900 dark:text-ink-100">需求澄清</h2>
          </div>
          <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
            {editable
              ? "请补充以下信息，CLARIFY Agent 将据此生成结构化需求文档"
              : "配置已锁定，如需修改请新建构建会话"}
          </p>

          {/* 进度条 */}
          {editable && questions.length > 0 && (
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-xs text-ink-500 dark:text-ink-400">
                <span>
                  第 {step + 1} / {questions.length} 题
                  {currentQuestion?.required && <span className="ml-1 text-destructive">*</span>}
                </span>
                <span className="tabular-nums">{progressPct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800">
                <div
                  className="h-full bg-ink-950 transition-all duration-300 dark:bg-ink-100"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 问答体 */}
        <div className="p-5">
          {questions.length === 0 ? (
            <div className="py-6 text-center text-sm text-ink-500 dark:text-ink-400">
              暂无预设问题
            </div>
          ) : editable && currentQuestion ? (
            <div className="space-y-4">
              {/* 当前问题 */}
              <div key={currentQuestion.id} className="space-y-2">
                <Label className="flex items-center gap-1 text-sm font-medium text-ink-900 dark:text-ink-100">
                  <span className="tabular-nums text-ink-400 dark:text-ink-500">
                    {(step + 1).toString().padStart(2, "0")}
                  </span>
                  <span className="ml-1">{currentQuestion.label}</span>
                  {currentQuestion.required && <span className="text-destructive">*</span>}
                </Label>
                <Textarea
                  autoFocus
                  value={answers[currentQuestion.id] ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      if (isLast) void onSubmit();
                      else goNext();
                    }
                  }}
                  placeholder={currentQuestion.placeholder}
                  rows={3}
                  className="input-glass border-0 bg-transparent font-mono shadow-none focus-visible:ring-0"
                />
                <p className="text-[11px] text-ink-500 dark:text-ink-400">
                  按 ⌘/Ctrl + Enter {isLast ? "提交" : "下一题"}
                </p>
              </div>

              {/* 步骤点 */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {questions.map((q, idx) => {
                  const filled = !!answers[q.id]?.trim();
                  const isCurrent = idx === step;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setStep(idx)}
                      className={
                        "flex h-7 w-7 items-center justify-center rounded-full text-xs tabular-nums transition-all duration-200 " +
                        (isCurrent
                          ? "bg-ink-950 text-ink-0 dark:bg-ink-100 dark:text-ink-950"
                          : filled
                            ? "bg-ink-200 text-ink-700 dark:bg-ink-800 dark:text-ink-300"
                            : "border border-ink-200 text-ink-400 dark:border-ink-700 dark:text-ink-500")
                      }
                      title={q.label}
                    >
                      {filled && !isCurrent ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q) => (
                <div key={q.id} className="space-y-1">
                  <Label className="text-xs text-ink-500 dark:text-ink-400">{q.label}</Label>
                  <div className="rounded bg-ink-100/40 px-3 py-2 text-sm text-ink-800 dark:bg-ink-900/40 dark:text-ink-200">
                    {answers[q.id] || (
                      <span className="text-ink-400 dark:text-ink-500">（未填写）</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 架构产物（已存在时展示） */}
          {currentSession.architecture && (
            <div className="mt-4 space-y-1.5">
              <Label className="text-xs">架构产物（ARCHITECT Agent 生成）</Label>
              <div className="rounded bg-ink-100/40 px-3 py-2 text-xs text-ink-800 dark:bg-ink-900/40 dark:text-ink-200">
                <div>
                  <span className="font-medium">前端：</span>
                  {currentSession.architecture.frontend.join(" / ")}
                </div>
                <div>
                  <span className="font-medium">后端：</span>
                  {currentSession.architecture.backend.join(" / ")}
                </div>
                <div>
                  <span className="font-medium">数据库：</span>
                  {currentSession.architecture.database.join(" / ")}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部操作 */}
        <div className="flex items-center justify-between border-t border-ink-200/60 bg-ink-50/40 p-4 dark:border-ink-800/60 dark:bg-ink-900/40">
          <span className="text-xs text-ink-500 dark:text-ink-400">
            版本 v{currentSession.version} · {formatDateTime(currentSession.updatedAt)}
          </span>
          {editable ? (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={goPrev}
                disabled={step === 0}
              >
                <ChevronLeft className="mr-1.5 h-4 w-4" />
                上一题
              </Button>
              {isLast ? (
                <button
                  className="btn-ink inline-flex items-center gap-2 text-sm"
                  onClick={() => void onSubmit()}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isUpdating ? "提交中..." : "提交并进入架构设计"}
                </button>
              ) : (
                <button
                  className="btn-ink inline-flex items-center gap-2 text-sm"
                  onClick={goNext}
                >
                  下一题
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <Badge variant="outline" className="gap-1 text-xs">
              <CheckCircle2 className="h-3 w-3" />
              已提交
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
