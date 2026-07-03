import * as React from "react";
import { useTranslation } from "react-i18next";
import { Bell, Check } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  toast,
} from "@lynxkit/ui-web";

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
        <Bell className="h-6 w-6 text-lynx-500" />
        <h1 className="text-2xl font-bold">{t("settings.notificationsTitle")}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("notifications.prefs")}</CardTitle>
          <CardDescription>{t("notifications.prefsDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {prefMeta.map((p) => {
            const on = prefs[p.key];
            return (
              <div key={p.key} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1 pr-4">
                  <div className="text-sm font-medium">{p.title}</div>
                  <div className="text-xs text-muted-foreground">{p.desc}</div>
                </div>
                <Button
                  variant={on ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggle(p.key)}
                  className={on ? "bg-lynx-500 text-white hover:bg-lynx-600" : ""}
                >
                  {on ? (
                    <>
                      <Check className="mr-1.5 h-3.5 w-3.5" />
                      {t("notifications.enabled")}
                    </>
                  ) : (
                    t("notifications.disabled")
                  )}
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
