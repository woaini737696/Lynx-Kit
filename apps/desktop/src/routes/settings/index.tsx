import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Cpu,
  User,
  Bell,
  Info,
  ChevronRight,
} from "lucide-react";

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
      <h1 className="mb-6 text-2xl font-bold text-ink-950 dark:text-ink-0">{t("settings.title")}</h1>
      <div className="space-y-2">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              to={s.href}
              className="glass-card flex items-center gap-4 p-4 transition-all duration-200 hover:-translate-y-px"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-950 text-ink-0 dark:bg-ink-100 dark:text-ink-950">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-ink-950 dark:text-ink-0">{s.title}</div>
                <div className="truncate text-sm text-ink-500 dark:text-ink-400">
                  {s.desc}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-ink-400 dark:text-ink-500" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
