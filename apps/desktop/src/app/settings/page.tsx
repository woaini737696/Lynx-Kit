"use client";

import Link from "next/link";
import {
  Cpu,
  User,
  Bell,
  Info,
  ChevronRight,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import {
  Card,
  CardContent,
} from "@lynxkit/ui-web";

const SECTIONS = [
  {
    href: "/settings/ai-models",
    icon: Cpu,
    title: "AI 模型配置",
    desc: "配置 DeepSeek / Kimi / Qwen / GLM 等模型供应商的 API Key",
  },
  {
    href: "/settings/profile",
    icon: User,
    title: "个人资料",
    desc: "管理账号信息、头像与密码",
  },
  {
    href: "/settings/profile",
    icon: Bell,
    title: "通知设置",
    desc: "构建完成通知、系统托盘行为",
  },
  {
    href: "/settings/profile",
    icon: Info,
    title: "关于",
    desc: "应用版本与更新检查",
  },
] as const;

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-bold">设置</h1>
        <div className="space-y-2">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <Link key={s.title} href={s.href}>
                <Card className="cursor-pointer transition hover:border-lynx-500/50">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lynx-500/10 text-lynx-500">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{s.title}</div>
                      <div className="truncate text-sm text-muted-foreground">
                        {s.desc}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
