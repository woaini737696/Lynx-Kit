import { Sparkles, Zap, ShieldCheck, Code2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { InspirationInput } from "@/components/build/inspiration-input";
import { isElectron } from "@/lib/electron";

/**
 * 首页：灵感输入
 *
 * 大标题"构建你的 AI 产品"+ 副标题 + 灵感输入框 + 示例 chips。
 * 桌面端额外提示本地 AI 可用。
 */
export default function HomePage() {
  const { t } = useTranslation();
  return (
    <main className="hero-glow relative flex min-h-screen flex-col items-center overflow-hidden">
      <div className="relative z-10 flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-20">
        {/* 徽章 */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-lynx-500/30 bg-lynx-500/10 px-4 py-1.5 text-sm text-lynx-600 dark:text-lynx-400">
          <Sparkles className="h-3.5 w-3.5" />
          {t("home.badge")}
        </div>

        <h1 className="text-center text-5xl font-bold tracking-tight sm:text-6xl">
          {t("home.titlePrefix")}{" "}
          <span className="bg-gradient-to-r from-lynx-500 to-lynx-400 bg-clip-text text-transparent">
            {t("home.titleHighlight")}
          </span>
        </h1>
        <p className="mt-5 text-center text-lg text-muted-foreground">
          {t("home.subtitle")}
        </p>

        <div className="mt-10 w-full">
          <InspirationInput />
        </div>

        {/* 特性卡片 */}
        <div className="mt-16 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
          <FeatureCard
            icon={<Zap className="h-5 w-5 text-lynx-500" />}
            title={t("home.feature.fast.title")}
            desc={t("home.feature.fast.desc")}
          />
          <FeatureCard
            icon={<Code2 className="h-5 w-5 text-lynx-500" />}
            title={t("home.feature.reviewable.title")}
            desc={t("home.feature.reviewable.desc")}
          />
          <FeatureCard
            icon={<ShieldCheck className="h-5 w-5 text-lynx-500" />}
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
    <div className="rounded-xl border border-border bg-card/60 backdrop-blur transition hover:border-lynx-500/50 hover:bg-card">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-lynx-500/10">
        {icon}
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
