import { Sparkles, Zap, ShieldCheck, Code2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { InspirationInput } from "@/components/build/inspiration-input";
import { isElectron } from "@/lib/electron";

/**
 * 首页：灵感输入
 *
 * 浅紫渐变光晕背景 + 毛玻璃欢迎卡 + 灵感输入 + 特性卡片。
 * 桌面端额外提示本地 AI 可用。
 */
export default function HomePage() {
  const { t } = useTranslation();
  return (
    <main
      className="relative flex min-h-screen flex-col items-center overflow-hidden"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(167,139,250,0.18), transparent 70%), radial-gradient(ellipse 60% 40% at 90% 20%, rgba(196,181,253,0.12), transparent 70%), radial-gradient(ellipse 50% 35% at 10% 80%, rgba(216,180,254,0.10), transparent 70%)",
      }}
    >
      <div className="relative z-10 flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-20">
        {/* 欢迎卡（毛玻璃） */}
        <div className="glass-card mb-8 w-full p-8">
          {/* 徽章 */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-ink-200 bg-ink-50/60 px-4 py-1.5 text-sm text-ink-700 dark:border-ink-700 dark:bg-ink-900/60 dark:text-ink-300">
            <Sparkles className="h-3.5 w-3.5" />
            {t("home.badge")}
          </div>

          <h1 className="text-center text-5xl font-bold tracking-tight text-ink-950 sm:text-6xl dark:text-ink-0">
            {t("home.titlePrefix")}{" "}
            <span className="text-ink-950 underline decoration-ink-300 decoration-2 underline-offset-4 dark:text-ink-0 dark:decoration-ink-600">
              {t("home.titleHighlight")}
            </span>
          </h1>
          <p className="mt-5 text-center text-lg text-ink-600 dark:text-ink-400">
            {t("home.subtitle")}
          </p>
        </div>

        <div className="mt-2 w-full">
          <InspirationInput />
        </div>

        {/* 特性卡片 */}
        <div className="mt-16 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
          <FeatureCard
            icon={<Zap className="h-5 w-5" />}
            title={t("home.feature.fast.title")}
            desc={t("home.feature.fast.desc")}
          />
          <FeatureCard
            icon={<Code2 className="h-5 w-5" />}
            title={t("home.feature.reviewable.title")}
            desc={t("home.feature.reviewable.desc")}
          />
          <FeatureCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title={t("home.feature.local.title")}
            desc={isElectron ? t("home.feature.local.descDesktop") : t("home.feature.local.descWeb")}
          />
        </div>
      </div>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="glass-card p-5 transition-all duration-200 hover:-translate-y-px">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-ink-950 text-ink-0 dark:bg-ink-100 dark:text-ink-950">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-100">{title}</h3>
      <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">{desc}</p>
    </div>
  );
}
