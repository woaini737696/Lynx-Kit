import * as React from "react";
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
  { label: string; variant: "default" | "secondary" | "destructive"; icon: React.ReactNode }
> = {
  draft: { label: "草稿", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
  clarifying: { label: "澄清中", variant: "default", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  architecting: { label: "架构中", variant: "default", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  developing: { label: "开发中", variant: "default", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  testing: { label: "测试中", variant: "default", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  deploying: { label: "部署中", variant: "default", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  deployed: { label: "已部署", variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
  error: { label: "失败", variant: "destructive", icon: <AlertCircle className="h-3 w-3" /> },
};

/**
 * 构建列表页
 *
 * 显示当前用户的所有构建会话，支持进入控制台、删除。
 */
export default function BuildListPage() {
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
        title: "加载构建列表失败",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [listSessions]);

  React.useEffect(() => {
    void load();
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remove = async (id: string) => {
    if (!confirm("确认删除此构建会话？此操作不可撤销。")) return;
    try {
      await buildApi.remove(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "已删除", variant: "success" });
    } catch (e) {
      toast({
        title: "删除失败",
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
          <h1 className="text-2xl font-bold">我的构建</h1>
        </div>
        <Link to="/">
          <Button className="bg-lynx-500 text-white hover:bg-lynx-600">
            <Plus className="mr-2 h-4 w-4" />
            新建构建
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
            <p className="text-base font-medium">还没有构建会话</p>
            <p className="mt-1 text-sm text-muted-foreground">
              在首页输入你的想法，AI 会帮你生成完整的 AI 产品
            </p>
            <Link to="/">
              <Button className="mt-4 bg-lynx-500 text-white hover:bg-lynx-600">
                开始构建
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
              (s.config?.userInput as string) ?? (s.config?.input as string) ?? "(未命名)";
            return (
              <Card key={s.id} className="transition hover:border-lynx-500/40">
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <Link to={`/build/${s.id}`} className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{userInput}</span>
                      <Badge variant={meta.variant} className="gap-1">
                        {meta.icon}
                        {meta.label}
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
                        进入控制台
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => void remove(s.id)}
                      title="删除"
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
