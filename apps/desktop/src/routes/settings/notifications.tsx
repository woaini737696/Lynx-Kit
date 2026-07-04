import * as React from "react";
import { useTranslation } from "react-i18next";
import { Bell, Check } from "lucide-react";
import { toast } from "@lynxkit/ui-web";

/** 通知偏好项（持久化到 localStorage） */
const PREFS_KEY = "lynxkit-notification-prefs";

const DEFAULT_PREFS = {
  buildCompleted: true,
  buildFailed: true,
  deploySuccess: true,
  systemTray: false,
  productUpdates: false,
};

type PrefKey = keyof typeof DEFAULT_PREFS;

export default function NotificationsPage() {
  const { t } = useTranslation();
  const [prefs, setPrefs] = React.useState(DEFAULT_PREFS);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(PREFS_KEY);
      if (saved) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(saved) });
    } catch {
      // ignore
    }
  }, []);

  const prefMeta: { key: PrefKey; title: string; desc: string }[] = [
    { key: "buildCompleted", title: t("notifications.buildCompletedTitle"), desc: t("notifications.buildCompletedDesc") },
    { key: "buildFailed", title: t("notifications.buildFailedTitle"), desc: t("notifications.buildFailedDesc") },
    { key: "deploySuccess", title: t("notifications.deploySuccessTitle"), desc: t("notifications.deploySuccessDesc") },
    { key: "systemTray", title: t("notifications.systemTrayTitle"), desc: t("notifications.systemTrayDesc") },
    { key: "productUpdates", title: t("notifications.productUpdatesTitle"), desc: t("notifications.productUpdatesDesc") },
  ];

  const toggle = (key: PrefKey) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    toast({ title: t("notifications.saved"), variant: "success" });
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-6 flex items-center gap-2">
        <Bell className="h-6 w-6 text-ink-950 dark:text-ink-100" />
        <h1 className="text-2xl font-bold text-ink-950 dark:text-ink-0">{t("settings.notificationsTitle")}</h1>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="border-b border-ink-200/60 px-6 py-4 dark:border-ink-800/60">
          <h2 className="text-base font-semibold text-ink-950 dark:text-ink-0">{t("notifications.prefs")}</h2>
          <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">{t("notifications.prefsDesc")}</p>
        </div>
        <div className="divide-y divide-ink-200/60 px-6 dark:divide-ink-800/60">
          {prefMeta.map((p) => {
            const on = prefs[p.key];
            return (
              <div key={p.key} className="flex items-center justify-between py-3 first:pt-4 last:pb-4">
                <div className="min-w-0 flex-1 pr-4">
                  <div className="text-sm font-medium text-ink-950 dark:text-ink-0">{p.title}</div>
                  <div className="text-xs text-ink-500 dark:text-ink-400">{p.desc}</div>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(p.key)}
                  className={
                    on
                      ? "btn-ink inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
                      : "inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-transparent px-3 py-1.5 text-xs text-ink-700 transition-all duration-200 hover:-translate-y-px hover:border-ink-950 hover:text-ink-950 dark:border-ink-700 dark:text-ink-300 dark:hover:border-ink-100 dark:hover:text-ink-100"
                  }
                >
                  {on ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      {t("notifications.enabled")}
                    </>
                  ) : (
                    t("notifications.disabled")
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
