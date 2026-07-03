import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Cpu,
  User,
  Bell,
  Info,
  ChevronRight,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@lynxkit/ui-web";

export default function SettingsPage() {
  const { t } = useTranslation();

  const sections = [
    {
      href: "/settings/ai-models",
      icon: Cpu,
      title: t("settings.aiModelsTitle"),
      desc: t("settings.aiModelsDesc"),
    },
    {
      href: "/settings/profile",
      icon: User,
      title: t("settings.profile"),
      desc: t("settings.profileDesc"),
    },
    {
      href: "/settings/notifications",
      icon: Bell,
      title: t("settings.notificationsTitle"),
      desc: t("settings.notificationsDesc"),
    },
    {
      href: "/settings/about",
      icon: Info,
      title: t("settings.about"),
      desc: t("settings.aboutDesc"),
    },
  ] as const;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("settings.title")}</h1>
      <div className="space-y-2">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.href} to={s.href}>
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
  );
}
