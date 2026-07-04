import * as React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Rocket,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Globe,
  Server,
  GitBranch,
  ExternalLink,
  AlertCircle,
  Package,
} from "lucide-react";
import {
  Button,
  Badge,
  Skeleton,
  toast,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  Input,
  Textarea,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@lynxkit/ui-web";
import { useBuild } from "@/hooks/use-build";
import { buildApi, storeApi } from "@/lib/api";
import {
  validatePublishForm,
  buildPublishPayload,
  type PublishFormState,
} from "@/lib/publish-form";
import { PricingType, StoreCategory } from "@lynxkit/shared";
import { formatDateTime } from "@/lib/utils";

/** 部署目标选项 */
const DEPLOY_TARGETS = [
  {
    id: "aliyun-ecs",
    name: "阿里云 ECS（2 核 2G）",
    desc: "本地构建产物上传部署，符合 2C2G 约束",
    icon: Server,
  },
  {
    id: "vercel",
    name: "Vercel（前端）",
    desc: "前端静态资源托管，自动 HTTPS",
    icon: Globe,
  },
  {
    id: "github-pages",
    name: "GitHub Pages",
    desc: "免费静态站点托管，适合 Demo",
    icon: GitBranch,
  },
] as const;

/** Mock 部署步骤 */
const DEPLOY_STEPS = [
  { id: "build", label: "本地构建产物", desc: "vite build + 服务端打包" },
  { id: "upload", label: "上传构建产物", desc: "仅上传 dist 与必要静态文件" },
  { id: "install", label: "安装依赖（生产）", desc: "npm ci --omit=dev" },
  { id: "migrate", label: "执行数据库迁移", desc: "drizzle migrate" },
  { id: "start", label: "启动服务", desc: "pm2 restart lynxkit-app" },
  { id: "health", label: "健康检查", desc: "GET /health 返回 200" },
] as const;

type DeployPhase = "idle" | "deploying" | "success" | "error";

/**
 * 构建部署页
 *
 * - 选择部署目标
 * - 一键部署（mock 流程，模拟各步骤进度）
 * - 部署成功后展示访问 URL + 回滚入口
 */
export default function DeployPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId!;
  const navigate = useNavigate();
  const { currentSession, loadSession, reset } = useBuild();

  const [loading, setLoading] = React.useState(true);
  const [target, setTarget] = React.useState<string>("aliyun-ecs");
  const [phase, setPhase] = React.useState<DeployPhase>("idle");
  const [currentStep, setCurrentStep] = React.useState<number>(-1);
  const [deployUrl, setDeployUrl] = React.useState<string | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // ===== 上架到商店状态 =====
  const [publishDialogOpen, setPublishDialogOpen] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [publishForm, setPublishForm] = React.useState<PublishFormState>({
    name: "",
    description: "",
    category: "",
    pricingType: "",
    price: "",
    tags: "",
    version: "1.0.0",
    demoUrl: "",
  });
  const [publishErrors, setPublishErrors] = React.useState<
    Partial<Record<keyof PublishFormState, string>>
  >({});

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadSession(sessionId)
      .then((session) => {
        if (session.deployUrl) {
          setDeployUrl(session.deployUrl);
          setPhase("success");
        }
      })
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
      if (timerRef.current) clearTimeout(timerRef.current);
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const runDeploy = async () => {
    if (phase === "deploying") return;
    setPhase("deploying");
    setCurrentStep(0);

    // 客户端按步骤推进 UI（每步 ~300ms），与后端 API 并行执行
    let step = 0;
    const advance = () => {
      step += 1;
      setCurrentStep(step);
      if (step < DEPLOY_STEPS.length) {
        timerRef.current = setTimeout(advance, 300);
      }
    };
    timerRef.current = setTimeout(advance, 300);

    try {
      // 调用真实部署 API（后端会更新状态为 DEPLOYING → DEPLOYED）
      const { session, deployUrl: realUrl } = await buildApi.deploy(
        sessionId,
        target as "aliyun-ecs" | "vercel" | "github-pages",
      );
      // 推进到完成
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setCurrentStep(DEPLOY_STEPS.length);
      setDeployUrl(realUrl);
      setPhase("success");
      // 同步会话状态到 store
      if (currentSession) {
        // 触发 use-build 内部状态更新
        await loadSession(sessionId);
      }
      toast({ title: "部署成功 🎉", variant: "success" });
      void session; // session 已通过 loadSession 应用
    } catch (e) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setPhase("error");
      toast({
        title: "部署失败",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    }
  };

  const rollback = async () => {
    if (!currentSession) return;
    if (!confirm(`确认回滚到 v${currentSession.version - 1}？`)) return;
    try {
      await buildApi.rollback(sessionId, currentSession.version - 1);
      toast({ title: "已回滚到上一版本", variant: "success" });
      await loadSession(sessionId);
    } catch (e) {
      toast({
        title: "回滚失败",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    }
  };

  // ===== 上架到商店：打开 Dialog 时根据会话预填表单 =====
  const openPublishDialog = () => {
    if (!currentSession) return;
    const productType = currentSession.productType;
    // 推断分类：与 productType 对齐（无 AGENT/WORKFLOW 时退回 SOCIAL）
    const inferredCategory =
      Object.values(StoreCategory).find(
        (c) => c.toLowerCase() === String(productType).toLowerCase(),
      ) ?? StoreCategory.SOCIAL;

    // 用户原始输入存在 config.userInput
    const userInput =
      (currentSession.config?.userInput as string | undefined) ?? "";

    setPublishForm({
      name: userInput.slice(0, 40) || "未命名产品",
      description: userInput,
      category: inferredCategory,
      pricingType: PricingType.FREE,
      price: "",
      tags: "",
      version: "1.0.0",
      demoUrl: deployUrl ?? "",
    });
    setPublishErrors({});
    setPublishDialogOpen(true);
  };

  // ===== 上架到商店：更新单个表单字段，清掉对应错误 =====
  const updatePublishField = <K extends keyof PublishFormState>(
    key: K,
    value: PublishFormState[K],
  ) => {
    setPublishForm((prev) => ({ ...prev, [key]: value }));
    setPublishErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // ===== 上架到商店：提交 =====
  const submitPublish = async () => {
    if (!currentSession) return;
    const errors = validatePublishForm(publishForm);
    setPublishErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setPublishing(true);
    try {
      const payload = buildPublishPayload(
        sessionId,
        currentSession.productType,
        publishForm,
      );
      const result = await storeApi.publish(payload);
      toast({ title: "已上架到商店（待审核）", variant: "success" });
      setPublishDialogOpen(false);
      // 跳转到商店产品详情页
      navigate(`/store/${result.product.id}`);
    } catch (e) {
      toast({
        title: "上架失败",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <Skeleton className="mb-4 h-10 w-48 rounded-md" />
        <Skeleton className="mb-3 h-40 w-full rounded-card" />
        <Skeleton className="h-72 w-full rounded-card" />
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
  const canDeploy =
    status === "deployed" ||
    status === "deploying" ||
    (currentSession.generatedCode != null && phase === "idle");

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
        <Rocket className="h-5 w-5 text-ink-900 dark:text-ink-100" />
        <h1 className="text-lg font-semibold text-ink-950 dark:text-ink-0">部署</h1>
        <Badge
          variant={phase === "success" ? "default" : "secondary"}
          className="gap-1"
        >
          {phase === "success" ? (
            <>
              <CheckCircle2 className="h-3 w-3" />
              已部署
            </>
          ) : phase === "deploying" ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              部署中
            </>
          ) : (
            <>
              <AlertCircle className="h-3 w-3" />
              待部署
            </>
          )}
        </Badge>
      </div>

      {/* 部署目标 */}
      <div className="glass-card mb-4">
        <div className="border-b border-ink-200/60 p-4 dark:border-ink-800/60">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink-900 dark:text-ink-100">
            <Server className="h-4 w-4" />
            部署目标
          </div>
          <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
            选择部署平台（阿里云约束：本地构建后上传，禁止服务器构建）
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-3">
          {DEPLOY_TARGETS.map((t) => {
            const Icon = t.icon;
            const active = target === t.id;
            return (
              <button
                key={t.id}
                onClick={() => phase !== "deploying" && setTarget(t.id)}
                disabled={phase === "deploying"}
                className={
                  "rounded-lg border p-3 text-left transition-all duration-200 hover:-translate-y-px " +
                  (active
                    ? "border-ink-950 bg-ink-100/60 dark:border-ink-100 dark:bg-ink-900/60"
                    : "border-ink-200 hover:border-ink-950 dark:border-ink-700 dark:hover:border-ink-100") +
                  (phase === "deploying" ? " opacity-50" : "")
                }
              >
                <Icon className="mb-1.5 h-4 w-4 text-ink-900 dark:text-ink-100" />
                <div className="text-xs font-medium text-ink-900 dark:text-ink-100">{t.name}</div>
                <div className="mt-0.5 text-[11px] text-ink-500 dark:text-ink-400">
                  {t.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 部署步骤 */}
      <div className="glass-card mb-4">
        <div className="border-b border-ink-200/60 p-4 dark:border-ink-800/60">
          <div className="text-sm font-semibold text-ink-900 dark:text-ink-100">部署进度</div>
          <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
            {phase === "idle" && "点击下方按钮开始部署"}
            {phase === "deploying" && "正在执行部署流程..."}
            {phase === "success" && "部署完成，可访问下方 URL"}
            {phase === "error" && "部署失败，请查看日志"}
          </p>
        </div>
        <div className="p-4">
          <ol className="space-y-2">
            {DEPLOY_STEPS.map((s, i) => {
              const done = phase === "success" || i < currentStep;
              const active = phase === "deploying" && i === currentStep;
              return (
                <li
                  key={s.id}
                  className={
                    "flex items-start gap-3 rounded-md border px-3 py-2 transition-all duration-200 " +
                    (active
                      ? "border-ink-950 bg-ink-100/60 dark:border-ink-100 dark:bg-ink-900/60"
                      : "border-ink-200 dark:border-ink-800")
                  }
                >
                  <div className="mt-0.5">
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 text-ink-700 dark:text-ink-300" />
                    ) : active ? (
                      <Loader2 className="h-4 w-4 animate-spin text-ink-900 dark:text-ink-100" />
                    ) : (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-ink-300 text-[10px] text-ink-500 dark:border-ink-700 dark:text-ink-400">
                        {i + 1}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-ink-900 dark:text-ink-100">{s.label}</div>
                    <div className="text-[11px] text-ink-500 dark:text-ink-400">
                      {s.desc}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
        <div className="flex items-center justify-between border-t border-ink-200/60 bg-ink-50/40 p-4 dark:border-ink-800/60 dark:bg-ink-900/40">
          <span className="text-xs text-ink-500 dark:text-ink-400">
            会话 v{currentSession.version} · {formatDateTime(currentSession.updatedAt)}
          </span>
          <div className="flex items-center gap-2">
            {phase === "success" && currentSession.version > 1 && (
              <Button variant="outline" size="sm" onClick={() => void rollback()}>
                回滚到上一版本
              </Button>
            )}
            {phase === "idle" || phase === "error" ? (
              <button
                className="btn-ink inline-flex items-center gap-1.5 text-sm disabled:opacity-50"
                onClick={() => void runDeploy()}
                disabled={!canDeploy}
              >
                <Rocket className="h-4 w-4" />
                一键部署
              </button>
            ) : phase === "deploying" ? (
              <Button variant="destructive" size="sm" disabled>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                部署中...
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* 部署结果 */}
      {phase === "success" && deployUrl && (
        <div className="glass-card">
          <div className="border-b border-ink-200/60 p-4 dark:border-ink-800/60">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink-900 dark:text-ink-100">
              <CheckCircle2 className="h-4 w-4 text-ink-700 dark:text-ink-300" />
              部署成功
            </div>
          </div>
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between rounded-md border border-ink-200 bg-ink-50/60 px-3 py-2 dark:border-ink-800 dark:bg-ink-900/60">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-ink-700 dark:text-ink-300" />
                <span className="text-sm text-ink-900 dark:text-ink-100">{deployUrl}</span>
              </div>
              <a href={deployUrl} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  访问
                </Button>
              </a>
            </div>

            {/* 一键上架到商店 */}
            <div className="flex items-center justify-between rounded-md border border-ink-300 bg-ink-100/60 px-3 py-2 dark:border-ink-700 dark:bg-ink-900/60">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-ink-900 dark:text-ink-100" />
                <div>
                  <div className="text-xs font-medium text-ink-900 dark:text-ink-100">上架到 AI 应用商店</div>
                  <div className="text-[11px] text-ink-500 dark:text-ink-400">
                    发布后进入待审核，审核通过即可在商店被搜索 / 购买
                  </div>
                </div>
              </div>
              <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
                <DialogTrigger asChild>
                  <button
                    className="btn-ink inline-flex items-center gap-1.5 text-xs"
                    onClick={openPublishDialog}
                  >
                    <Package className="h-3.5 w-3.5" />
                    上架到商店
                  </button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>上架到商店</DialogTitle>
                    <DialogDescription>
                      填写产品信息，提交后进入待审核状态。
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3">
                    {/* 名称 */}
                    <div className="space-y-1">
                      <Label htmlFor="pf-name">产品名称 *</Label>
                      <Input
                        id="pf-name"
                        value={publishForm.name}
                        onChange={(e) =>
                          updatePublishField("name", e.target.value)
                        }
                        placeholder="例如：AI 客服小助手"
                      />
                      {publishErrors.name && (
                        <p className="text-xs text-destructive">
                          {publishErrors.name}
                        </p>
                      )}
                    </div>

                    {/* 简介 */}
                    <div className="space-y-1">
                      <Label htmlFor="pf-desc">产品简介 *</Label>
                      <Textarea
                        id="pf-desc"
                        value={publishForm.description}
                        onChange={(e) =>
                          updatePublishField("description", e.target.value)
                        }
                        rows={3}
                        placeholder="一句话介绍产品的核心功能"
                      />
                      {publishErrors.description && (
                        <p className="text-xs text-destructive">
                          {publishErrors.description}
                        </p>
                      )}
                    </div>

                    {/* 分类 + 定价类型 */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>分类 *</Label>
                        <Select
                          value={publishForm.category}
                          onValueChange={(v) =>
                            updatePublishField(
                              "category",
                              v as StoreCategory,
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择分类" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(StoreCategory).map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {publishErrors.category && (
                          <p className="text-xs text-destructive">
                            {publishErrors.category}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label>定价类型 *</Label>
                        <Select
                          value={publishForm.pricingType}
                          onValueChange={(v) =>
                            updatePublishField(
                              "pricingType",
                              v as PricingType,
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择定价" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={PricingType.FREE}>免费</SelectItem>
                            <SelectItem value={PricingType.ONETIME}>一次性买断</SelectItem>
                            <SelectItem value={PricingType.SUBSCRIPTION}>订阅</SelectItem>
                            <SelectItem value={PricingType.USAGE}>按量计费</SelectItem>
                          </SelectContent>
                        </Select>
                        {publishErrors.pricingType && (
                          <p className="text-xs text-destructive">
                            {publishErrors.pricingType}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 价格（非免费时显示） */}
                    {publishForm.pricingType &&
                      publishForm.pricingType !== PricingType.FREE && (
                        <div className="space-y-1">
                          <Label htmlFor="pf-price">价格（分）*</Label>
                          <Input
                            id="pf-price"
                            type="number"
                            value={publishForm.price}
                            onChange={(e) =>
                              updatePublishField("price", e.target.value)
                            }
                            placeholder="例如：1990 表示 19.9 元"
                          />
                          {publishErrors.price && (
                            <p className="text-xs text-destructive">
                              {publishErrors.price}
                            </p>
                          )}
                        </div>
                      )}

                    {/* 标签 */}
                    <div className="space-y-1">
                      <Label htmlFor="pf-tags">标签（逗号分隔，最多 10 个）</Label>
                      <Input
                        id="pf-tags"
                        value={publishForm.tags}
                        onChange={(e) =>
                          updatePublishField("tags", e.target.value)
                        }
                        placeholder="例如：AI,客服,LLM"
                      />
                    </div>

                    {/* 版本号 + 演示地址 */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="pf-version">版本号</Label>
                        <Input
                          id="pf-version"
                          value={publishForm.version}
                          onChange={(e) =>
                            updatePublishField("version", e.target.value)
                          }
                          placeholder="1.0.0"
                        />
                        {publishErrors.version && (
                          <p className="text-xs text-destructive">
                            {publishErrors.version}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="pf-demo">演示地址</Label>
                        <Input
                          id="pf-demo"
                          value={publishForm.demoUrl}
                          onChange={(e) =>
                            updatePublishField("demoUrl", e.target.value)
                          }
                          placeholder="https://..."
                        />
                        {publishErrors.demoUrl && (
                          <p className="text-xs text-destructive">
                            {publishErrors.demoUrl}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setPublishDialogOpen(false)}
                      disabled={publishing}
                    >
                      取消
                    </Button>
                    <button
                      className="btn-ink inline-flex items-center gap-1.5 text-sm disabled:opacity-50"
                      onClick={() => void submitPublish()}
                      disabled={publishing}
                    >
                      {publishing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          提交中...
                        </>
                      ) : (
                        <>
                          <Package className="h-4 w-4" />
                          提交上架
                        </>
                      )}
                    </button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
