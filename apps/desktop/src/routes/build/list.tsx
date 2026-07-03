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
  Card,
  CardContent,
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
          <Hammer className="h-6 w-6 text-lynx-500" />
          <h1 className="text-2xl font-bold">{t("build.myBuilds")}</h1>
        </div>
        <Link to="/">
          <Button className="bg-lynx-500 text-white hover:bg-lynx-600">
            <Plus className="mr-2 h-4 w-4" />
            {t("build.newBuild")}
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-20 text-center">
            <Hammer className="mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="text-base font-medium">{t("build.empty")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("build.emptySubtitle")}
            </p>
            <Link to="/">
              <Button className="mt-4 bg-lynx-500 text-white hover:bg-lynx-600">
                {t("build.startBuild")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const meta = STATUS_META[s.status] ?? STATUS_META.draft;
            const userInput =
              (s.config?.userInput as string) ?? (s.config?.input as string) ?? t("build.untitled");
            return (
              <Card key={s.id} className="transition hover:border-lynx-500/40">
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <Link to={`/build/${s.id}`} className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{userInput}</span>
                      <Badge variant={meta.variant} className="gap-1">
                        {meta.icon}
                        {t(`build.status.${s.status}`)}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        v{s.version}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{s.productType}</span>
                      <span>·</span>
                      <span>{formatDateTime(s.updatedAt)}</span>
                      {s.deployUrl && (
                        <>
                          <span>·</span>
                          <span className="truncate text-lynx-600">{s.deployUrl}</span>
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
