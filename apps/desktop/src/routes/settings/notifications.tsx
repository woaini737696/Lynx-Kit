import * as React from "react";
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

const PREF_META: { key: keyof typeof DEFAULT_PREFS; title: string; desc: string }[] = [
  { key: "buildCompleted", title: "构建完成通知", desc: "9 层 Agent 流水线跑完时提醒" },
  { key: "buildFailed", title: "构建失败通知", desc: "任一 Agent 报错中断时提醒" },
  { key: "deploySuccess", title: "部署成功通知", desc: "应用部署完成可访问时提醒" },
  { key: "systemTray", title: "系统托盘驻留", desc: "关闭窗口时最小化到托盘而非退出" },
  { key: "productUpdates", title: "产品更新通知", desc: "关注的商店产品更新时提醒" },
];

export default function NotificationsPage() {
  const [prefs, setPrefs] = React.useState(DEFAULT_PREFS);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(PREFS_KEY);
      if (saved) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(saved) });
    } catch {
      // ignore
    }
  }, []);

  const toggle = (key: keyof typeof DEFAULT_PREFS) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    toast({ title: "已保存", variant: "success" });
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-6 flex items-center gap-2">
        <Bell className="h-6 w-6 text-lynx-500" />
        <h1 className="text-2xl font-bold">通知设置</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">通知偏好</CardTitle>
          <CardDescription>选择需要接收的通知类型</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {PREF_META.map((p) => {
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
                      已开启
                    </>
                  ) : (
                    "已关闭"
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
