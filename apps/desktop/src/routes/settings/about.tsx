import * as React from "react";
import { useTranslation } from "react-i18next";
import { Info, RefreshCw, Check, Loader2, Download, RotateCw } from "lucide-react";
import { Button, Badge, toast } from "@lynxkit/ui-web";
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
        <Info className="h-6 w-6 text-ink-950 dark:text-ink-100" />
        <h1 className="text-2xl font-bold text-ink-950 dark:text-ink-0">{t("settings.about")}</h1>
      </div>

      <div className="glass-card mb-4 overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink-200/60 px-6 py-4 dark:border-ink-800/60">
          <div>
            <h2 className="text-base font-semibold text-ink-950 dark:text-ink-0">妙想</h2>
            <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">{t("common.tagline")}</p>
          </div>
          <Badge variant="outline" className="border-ink-200 text-ink-700 dark:border-ink-700 dark:text-ink-300">
            v{APP_VERSION}
          </Badge>
        </div>
        <div className="p-6">
          <p className="text-sm text-ink-700 dark:text-ink-300">
            {t("about.description")}
          </p>
          {status.kind === "available" && status.version && (
            <div className="mt-3 rounded-md border border-ink-950/20 bg-ink-100/60 p-3 text-sm dark:border-ink-100/20 dark:bg-ink-900/60">
              <span className="font-medium text-ink-950 dark:text-ink-100">
                {t("about.newVersion")} v{status.version}
              </span>
            </div>
          )}
          {status.kind === "downloading" && (
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs text-ink-500 dark:text-ink-400">
                <span>{t("about.downloading")}</span>
                <span>{status.percent}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                <div
                  className="h-full bg-ink-950 transition-all dark:bg-ink-100"
                  style={{ width: `${status.percent}%` }}
                />
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-ink-200/60 bg-ink-50/50 px-6 py-3 dark:border-ink-800/60 dark:bg-ink-900/40">
          {status.kind === "idle" && (
            <Button
              variant="outline"
              size="sm"
              onClick={checkUpdate}
              className="rounded-full border-ink-200 text-ink-700 hover:bg-ink-100 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {t("about.checkUpdate")}
            </Button>
          )}
          {status.kind === "checking" && (
            <Button
              variant="outline"
              size="sm"
              disabled
              className="rounded-full border-ink-200 text-ink-700 dark:border-ink-700 dark:text-ink-300"
            >
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("about.checking")}
            </Button>
          )}
          {status.kind === "up-to-date" && (
            <Button
              variant="outline"
              size="sm"
              onClick={checkUpdate}
              className="rounded-full border-ink-200 text-ink-700 hover:bg-ink-100 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
            >
              <Check className="mr-2 h-4 w-4 text-ink-950 dark:text-ink-100" />
              {t("about.upToDate")}
            </Button>
          )}
          {status.kind === "available" && (
            <button
              type="button"
              onClick={startDownload}
              className="btn-ink inline-flex items-center gap-2 px-3 py-1.5 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              {t("about.downloadUpdate")}
            </button>
          )}
          {status.kind === "downloaded" && (
            <button
              type="button"
              onClick={installNow}
              className="btn-ink inline-flex items-center gap-2 px-3 py-1.5 text-xs"
            >
              <RotateCw className="h-3.5 w-3.5" />
              {t("about.installRestart")}
            </button>
          )}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="border-b border-ink-200/60 px-6 py-4 dark:border-ink-800/60">
          <h2 className="text-sm font-semibold text-ink-950 dark:text-ink-0">{t("about.techStack")}</h2>
        </div>
        <div className="space-y-3 p-6">
          {TECH_STACK.map((tech) => (
            <div key={tech.category} className="flex items-start gap-3">
              <span className="w-20 shrink-0 text-xs font-medium text-ink-500 dark:text-ink-400">
                {tech.category}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {tech.items.map((item) => (
                  <Badge
                    key={item}
                    variant="outline"
                    className="border-ink-200 text-[10px] text-ink-700 dark:border-ink-700 dark:text-ink-300"
                  >
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
