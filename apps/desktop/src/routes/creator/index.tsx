import * as React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  UserSquare,
  Package,
  DollarSign,
  Star,
  Download,
  Loader2,
  TrendingUp,
} from "lucide-react";
import {
  Button,
  Skeleton,
  toast,
} from "@lynxkit/ui-web";
import { creatorApi } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import type { CreatorProfile } from "@lynxkit/shared";
import type { CreatorStats } from "@lynxkit/api-client";

export default function CreatorPage() {
  const { t } = useTranslation();
  const [profile, setProfile] = React.useState<CreatorProfile | null>(null);
  const [stats, setStats] = React.useState<CreatorStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [enabling, setEnabling] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([
        creatorApi.getProfile().catch(() => null),
        creatorApi.getStats().catch(() => null),
      ]);
      setProfile(p);
      setStats(s);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const enable = async () => {
    setEnabling(true);
    try {
      const p = await creatorApi.enable({});
      setProfile(p);
      toast({ title: t("creator.enabledToast"), variant: "success" });
    } catch (e) {
      toast({
        title: t("creator.enableFailed"),
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setEnabling(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <Skeleton className="h-48 w-full rounded-card" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserSquare className="h-6 w-6 text-ink-900 dark:text-ink-100" />
          <h1 className="text-2xl font-bold text-ink-950 dark:text-ink-0">{t("creator.centerTitle")}</h1>
        </div>
        <Link to="/creator/products">
          <Button variant="outline">
            <Package className="mr-2 h-4 w-4" />
            {t("creator.manageProducts")}
          </Button>
        </Link>
      </div>

      {!profile ? (
        <div className="glass-card flex flex-col items-center p-16 text-center">
          <UserSquare className="mb-3 h-12 w-12 text-ink-300 dark:text-ink-700" />
          <p className="text-sm text-ink-500 dark:text-ink-400">
            {t("creator.emptyHint")}
          </p>
          <button
            onClick={enable}
            disabled={enabling}
            className="btn-ink mt-4 inline-flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {enabling && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("creator.enableButton")}
          </button>
        </div>
      ) : (
        <>
          {/* 收益统计 */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={<DollarSign className="h-4 w-4" />}
              label={t("creator.stats.totalIncome")}
              value={formatPrice(stats?.totalIncome ?? profile.totalIncome)}
            />
            <StatCard
              icon={<TrendingUp className="h-4 w-4" />}
              label={t("creator.stats.balance")}
              value={formatPrice(stats?.balance ?? profile.balance)}
            />
            <StatCard
              icon={<Package className="h-4 w-4" />}
              label={t("creator.stats.productCount")}
              value={String(stats?.productCount ?? profile.productCount)}
            />
            <StatCard
              icon={<Star className="h-4 w-4" />}
              label={t("creator.stats.avgRating")}
              value={(stats?.avgRating ?? profile.avgRating).toFixed(1)}
            />
          </div>

          <div className="glass-card">
            <div className="border-b border-ink-200/60 p-5 dark:border-ink-800/60">
              <div className="text-base font-semibold text-ink-900 dark:text-ink-100">{t("creator.profile.title")}</div>
              <p className="text-sm text-ink-500 dark:text-ink-400">{profile.displayName}</p>
            </div>
            <div className="space-y-2 p-5 text-sm">
              {profile.bio && <p className="text-ink-600 dark:text-ink-400">{profile.bio}</p>}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink-950 underline decoration-ink-300 underline-offset-4 hover:text-ink-700 dark:text-ink-100 dark:decoration-ink-600"
                >
                  {profile.website}
                </a>
              )}
              <div className="flex items-center gap-4 text-xs text-ink-500 dark:text-ink-400">
                <span className="inline-flex items-center gap-1">
                  <Download className="h-3 w-3" />
                  {t("creator.profile.downloads", {
                    count: stats?.totalDownloads ?? profile.totalDownloads,
                  })}
                </span>
                {profile.verified && (
                  <span className="text-ink-900 dark:text-ink-100">{t("creator.profile.verified")}</span>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 text-xs text-ink-500 dark:text-ink-400">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-ink-950 text-ink-0 dark:bg-ink-100 dark:text-ink-950">
          {icon}
        </span>
        {label}
      </div>
      <div className="mt-1 text-xl font-bold text-ink-950 dark:text-ink-0">{value}</div>
    </div>
  );
}
