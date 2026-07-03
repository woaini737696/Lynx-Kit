import * as React from "react";
import { useTranslation } from "react-i18next";
import { Search, Store as StoreIcon } from "lucide-react";
import { ProductCard } from "@/components/store/product-card";
import {
  Input,
  Skeleton,
  Badge,
  toast,
} from "@lynxkit/ui-web";
import { storeApi } from "@/lib/api";
import { StoreCategory } from "@lynxkit/shared";
import type { StoreProduct } from "@lynxkit/shared";

const CATEGORIES: { value: StoreCategory | "all" }[] = [
  { value: "all" },
  { value: StoreCategory.SOCIAL },
  { value: StoreCategory.SYSTEM },
  { value: StoreCategory.WORKSTATION },
  { value: StoreCategory.DATA },
  { value: StoreCategory.ADMIN },
  { value: StoreCategory.APP },
  { value: StoreCategory.MARKETING },
  { value: StoreCategory.HARDWARE },
  { value: StoreCategory.AGENT },
  { value: StoreCategory.WORKFLOW },
];

export default function StorePage() {
  const { t } = useTranslation();
  const [products, setProducts] = React.useState<StoreProduct[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  const [category, setCategory] = React.useState<StoreCategory | "all">("all");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await storeApi.list({
        q: q || undefined,
        category: category === "all" ? undefined : category,
        sort: "popular",
      });
      setProducts(res.items);
    } catch (e) {
      toast({
        title: t("store.loadFailed"),
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [q, category, t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-center gap-2">
        <StoreIcon className="h-6 w-6 text-lynx-500" />
        <h1 className="text-2xl font-bold">{t("store.title")}</h1>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("store.searchPlaceholder")}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={
                category === c.value
                  ? "rounded-full bg-lynx-500/10 px-3 py-1 text-sm text-lynx-600"
                  : "rounded-full px-3 py-1 text-sm text-muted-foreground hover:bg-accent"
              }
            >
              {t(`store.category.${c.value.toLowerCase()}`)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full rounded-xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-sm text-muted-foreground">
          <StoreIcon className="mb-3 h-10 w-10 opacity-30" />
          {t("store.noProducts")}
          {category !== "all" && (
            <Badge variant="outline" className="mt-2">
              {t("store.categoryLabel")}
              {t(`store.category.${category.toLowerCase()}`)}
            </Badge>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
