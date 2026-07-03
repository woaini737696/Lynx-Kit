import * as React from "react";
import { useTranslation } from "react-i18next";
import { Info, RefreshCw, Check, Loader2, Download, RotateCw } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Badge,
  toast,
} from "@lynxkit/ui-web";
import { electronAPI } from "@/lib/electron";

const APP_VERSION = "0.1.0";

const TECH_STACK: { category: string; items: string[] }[] = [
  { category: "桌面端", items: ["Electron 30", "Vite 5", "React 19", "React Router 7"] },
  { category: "Web 端", items: ["Next.js 15", "React 19", "Tailwind CSS"] },
  { category: "后端", items: ["Hono", "Node.js", "PostgreSQL", "Drizzle ORM", "Redis"] },
  { category: "Agent 引擎", items: ["9 层 Agent 流水线", "AI SDK", "SSE 流式"] },
  { category: "UI", items: ["shadcn/ui", "Radix UI", "lucide-react"] },
];

type UpdateStatus =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "up-to-date" }
  | { kind: "available"; version?: string }
  | { kind: "downloading"; percent: number }
  | { kind: "downloaded" }
  | { kind: "error"; message: string };

export default function AboutPage() {
  const { t } = useTranslation();
  const [status, setStatus] = React.useState<UpdateStatus>({ kind: "idle" });

  // 订阅 updater 事件（preload 暴露的 unsubscribe 函数）
  React.useEffect(() => {
    if (!electronAPI?.updater) return;

    const offAvail = electronAPI.updater.onUpdateAvailable((info) => {
      const version = (info as { version?: string } | undefined)?.version;
      setStatus({ kind: "available", version });
    });
    const offProgress = electronAPI.updater.onProgress((p) => {
      setStatus({ kind: "downloading", percent: Math.round(p.percent) });
    });
    const offDownloaded = electronAPI.updater.onDownloaded(() => {
      setStatus({ kind: "downloaded" });
      toast({ title: t("updater.downloaded"), variant: "success" });
    });

    return () => {
      offAvail?.();
      offProgress?.();
      offDownloaded?.();
    };
  }, [t]);

  const checkUpdate = async () => {
    setStatus({ kind: "checking" });
    if (!electronAPI?.updater) {
      setStatus({ kind: "up-to-date" });
      toast({ title: t("updater.notAvailable"), variant: "default" });
      return;
    }
    try {
      // 触发检查；结果通过 onUpdateAvailable / update-not-available 事件返回
      await electronAPI.updater.check();
      // 兜底：若 3 秒内无事件，假设已是最新版本
      setTimeout(() => {
        setStatus((s) => (s.kind === "checking" ? { kind: "up-to-date" } : s));
      }, 3000);
    } catch (err) {
      setStatus({ kind: "error", message: String(err) });
      toast({ title: t("updater.checkFailed"), variant: "destructive" });
    }
  };

  const startDownload = () => {
    void electronAPI?.updater?.download();
  };

  const installNow = () => {
    void electronAPI?.updater?.install();
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-6 flex items-center gap-2">
        <Info className="h-6 w-6 text-lynx-500" />
        <h1 className="text-2xl font-bold">{t("settings.about")}</h1>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">妙想</CardTitle>
              <CardDescription>{t("common.tagline")}</CardDescription>
            </div>
            <Badge variant="outline">v{APP_VERSION}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t("about.description")}
          </p>
          {status.kind === "available" && status.version && (
            <div className="mt-3 rounded-md border border-lynx-500/30 bg-lynx-500/5 p-3 text-sm">
              <span className="font-medium text-lynx-600">
                {t("about.newVersion")} v{status.version}
              </span>
            </div>
          )}
          {status.kind === "downloading" && (
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>{t("about.downloading")}</span>
                <span>{status.percent}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-lynx-500 transition-all"
                  style={{ width: `${status.percent}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t bg-muted/30 py-3 gap-2 flex-wrap">
          {status.kind === "idle" && (
            <Button variant="outline" size="sm" onClick={checkUpdate}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t("about.checkUpdate")}
            </Button>
          )}
          {status.kind === "checking" && (
            <Button variant="outline" size="sm" disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("about.checking")}
            </Button>
          )}
          {status.kind === "up-to-date" && (
            <Button variant="outline" size="sm" onClick={checkUpdate}>
              <Check className="mr-2 h-4 w-4 text-green-600" />
              {t("about.upToDate")}
            </Button>
          )}
          {status.kind === "available" && (
            <Button
              variant="default"
              size="sm"
              className="bg-lynx-500 hover:bg-lynx-600"
              onClick={startDownload}
            >
              <Download className="mr-2 h-4 w-4" />
              {t("about.downloadUpdate")}
            </Button>
          )}
          {status.kind === "downloaded" && (
            <Button
              variant="default"
              size="sm"
              className="bg-lynx-500 hover:bg-lynx-600"
              onClick={installNow}
            >
              <RotateCw className="mr-2 h-4 w-4" />
              {t("about.installRestart")}
            </Button>
          )}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t("about.techStack")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {TECH_STACK.map((tech) => (
            <div key={tech.category} className="flex items-start gap-3">
              <span className="w-20 shrink-0 text-xs font-medium text-muted-foreground">
                {tech.category}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {tech.items.map((item) => (
                  <Badge key={item} variant="secondary" className="text-[10px]">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
