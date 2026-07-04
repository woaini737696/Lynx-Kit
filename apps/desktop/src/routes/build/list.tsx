import * as React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Hammer,
  Plus,
  Loader2,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import {
  Button,
  Badge,
  Skeleton,
  toast,
} from "@lynxkit/ui-web";
import { buildApi } from "@/lib/api";
import { useBuild } from "@/hooks/use-build";
import { formatDateTime } from "@/lib/utils";
import type { BuildSession, BuildStatus } from "@lynxkit/shared";

/** 状态映射 */
const STATUS_META: Record<
  BuildStatus,
  { variant: "default" | "secondary" | "destructive"; icon: React.ReactNode }
> = {
  draft: { variant: "secondary", icon: <Clock className="h-3 w-3" /> },
  clarifying: { variant: "default", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  architecting: { variant: "default", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  developing: { variant: "default", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  testing: { variant: "default", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  deploying: { variant: "default", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  deployed: { variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
  error: { variant: "destructive", icon: <AlertCircle className="h-3 w-3" /> },
};

/**
 * 构建列表页
 *
 * 显示当前用户的所有构建会话，支持进入控制台、删除。
 */
export default function BuildListPage() {
  const { t } = useTranslation();
  const { listSessions, reset } = useBuild();
  const [sessions, setSessions] = React.useState<BuildSession[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const list = await listSessions();
      setSessions(list);
    } catch (e) {
      toast({
        title: t("build.loadListFailed"),
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [listSessions, t]);

  React.useEffect(() => {
    void load();
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remove = async (id: string) => {
    if (!confirm(t("build.deleteConfirm"))) return;
    try {
      await buildApi.remove(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      toast({ title: t("build.deleted"), variant: "success" });
    } catch (e) {
      toast({
        title: t("build.deleteFailed"),
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hammer className="h-6 w-6 text-ink-900 dark:text-ink-100" />
          <h1 className="text-2xl font-bold text-ink-950 dark:text-ink-0">{t("build.myBuilds")}</h1>
        </div>
        <Link to="/">
          <button className="btn-ink inline-flex items-center gap-2 text-sm">
            <Plus className="h-4 w-4" />
            {t("build.newBuild")}
          </button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-card" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="glass-card flex flex-col items-center p-20 text-center">
          <Hammer className="mb-3 h-12 w-12 text-ink-300 dark:text-ink-700" />
          <p className="text-base font-medium text-ink-900 dark:text-ink-100">{t("build.empty")}</p>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            {t("build.emptySubtitle")}
          </p>
          <Link to="/" className="mt-4">
            <button className="btn-ink inline-flex items-center gap-2 text-sm">
              {t("build.startBuild")}
              <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const meta = STATUS_META[s.status] ?? STATUS_META.draft;
            const userInput =
              (s.config?.userInput as string) ?? (s.config?.input as string) ?? t("build.untitled");
            return (
              <div
                key={s.id}
                className="glass-card flex items-center justify-between gap-4 p-4 transition-all duration-200 hover:-translate-y-px"
              >
                <Link to={`/build/${s.id}`} className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-ink-900 dark:text-ink-100">{userInput}</span>
                    <Badge variant={meta.variant} className="gap-1">
                      {meta.icon}
                      {t(`build.status.${s.status}`)}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      v{s.version}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-ink-500 dark:text-ink-400">
                    <span>{s.productType}</span>
                    <span>·</span>
                    <span>{formatDateTime(s.updatedAt)}</span>
                    {s.deployUrl && (
                      <>
                        <span>·</span>
                        <span className="truncate text-ink-700 dark:text-ink-300">{s.deployUrl}</span>
                      </>
                    )}
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <Link to={`/build/${s.id}`}>
                    <Button variant="outline" size="sm">
                      {t("build.enterConsole")}
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void remove(s.id)}
                    title={t("build.delete")}
                  >
                    <XCircle className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
