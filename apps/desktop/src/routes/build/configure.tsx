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
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
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
 */
export default function ConfigurePage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId!;
  const { currentSession, loadSession, updateConfig, isUpdating, reset } = useBuild();

  const [loading, setLoading] = React.useState(true);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});

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
        <Skeleton className="mb-3 h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
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
  const editable = status === "clarifying" || status === "draft";
  const questions = CLARIFY_QUESTIONS[currentSession.productType] ?? [];
  const userInput =
    (currentSession.config?.userInput as string) ??
    (currentSession.config?.input as string) ??
    "(未命名需求)";

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
        <Settings2 className="h-5 w-5 text-lynx-500" />
        <h1 className="text-xl font-bold">配置</h1>
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
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">原始需求</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="rounded-md bg-muted/40 px-3 py-2 text-sm">
            {userInput}
          </p>
        </CardContent>
      </Card>

      {/* 澄清问题表单 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ListChecks className="h-4 w-4 text-lynx-500" />
            需求澄清
          </CardTitle>
          <CardDescription className="text-xs">
            {editable
              ? "请补充以下信息，CLARIFY Agent 将据此生成结构化需求文档"
              : "配置已锁定，如需修改请新建构建会话"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              暂无预设问题
            </div>
          ) : (
            questions.map((q) => (
              <div key={q.id} className="space-y-1.5">
                <Label className="flex items-center gap-1 text-xs">
                  {q.label}
                  {q.required && <span className="text-destructive">*</span>}
                </Label>
                {editable ? (
                  <Textarea
                    value={answers[q.id] ?? ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                    }
                    placeholder={q.placeholder}
                    rows={2}
                  />
                ) : (
                  <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
                    {answers[q.id] || (
                      <span className="text-muted-foreground">（未填写）</span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}

          {/* 架构产物（已存在时展示） */}
          {currentSession.architecture && (
            <div className="space-y-1.5">
              <Label className="text-xs">架构产物（ARCHITECT Agent 生成）</Label>
              <div className="rounded-md border bg-muted/20 px-3 py-2 text-xs">
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
        </CardContent>
        <CardFooter className="justify-between border-t bg-muted/30 py-3">
          <span className="text-xs text-muted-foreground">
            版本 v{currentSession.version} · {formatDateTime(currentSession.updatedAt)}
          </span>
          {editable ? (
            <Button
              className="bg-lynx-500 text-white hover:bg-lynx-600"
              onClick={() => void onSubmit()}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isUpdating ? "提交中..." : "提交并进入架构设计"}
            </Button>
          ) : (
            <Badge variant="outline" className="gap-1 text-xs">
              <CheckCircle2 className="h-3 w-3" />
              已提交
            </Badge>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
