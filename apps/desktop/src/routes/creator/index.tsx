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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserSquare className="h-6 w-6 text-lynx-500" />
          <h1 className="text-2xl font-bold">{t("creator.centerTitle")}</h1>
        </div>
        <Link to="/creator/products">
          <Button variant="outline">
            <Package className="mr-2 h-4 w-4" />
            {t("creator.manageProducts")}
          </Button>
        </Link>
      </div>

      {!profile ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <UserSquare className="mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {t("creator.emptyHint")}
            </p>
            <Button
              onClick={enable}
              disabled={enabling}
              className="mt-4 bg-lynx-500 text-white hover:bg-lynx-600"
            >
              {enabling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("creator.enableButton")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 收益统计 */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={<DollarSign className="h-4 w-4 text-green-500" />}
              label={t("creator.stats.totalIncome")}
              value={formatPrice(stats?.totalIncome ?? profile.totalIncome)}
            />
            <StatCard
              icon={<TrendingUp className="h-4 w-4 text-lynx-500" />}
              label={t("creator.stats.balance")}
              value={formatPrice(stats?.balance ?? profile.balance)}
            />
            <StatCard
              icon={<Package className="h-4 w-4 text-blue-500" />}
              label={t("creator.stats.productCount")}
              value={String(stats?.productCount ?? profile.productCount)}
            />
            <StatCard
              icon={<Star className="h-4 w-4 text-yellow-500" />}
              label={t("creator.stats.avgRating")}
              value={(stats?.avgRating ?? profile.avgRating).toFixed(1)}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("creator.profile.title")}</CardTitle>
              <CardDescription>{profile.displayName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {profile.bio && <p className="text-muted-foreground">{profile.bio}</p>}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-lynx-600 hover:underline"
                >
                  {profile.website}
                </a>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Download className="h-3 w-3" />
                  {t("creator.profile.downloads", {
                    count: stats?.totalDownloads ?? profile.totalDownloads,
                  })}
                </span>
                {profile.verified && (
                  <span className="text-green-600">{t("creator.profile.verified")}</span>
                )}
              </div>
            </CardContent>
          </Card>
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
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {icon}
          {label}
        </div>
        <div className="mt-1 text-xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
