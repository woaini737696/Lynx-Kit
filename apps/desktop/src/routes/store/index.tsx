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
        <StoreIcon className="h-6 w-6 text-ink-900 dark:text-ink-100" />
        <h1 className="text-2xl font-bold text-ink-950 dark:text-ink-0">{t("store.title")}</h1>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400 dark:text-ink-500" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("store.searchPlaceholder")}
            className="input-glass border-0 pl-9 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={
                "rounded-full px-3 py-1 text-sm transition-all duration-200 " +
                (category === c.value
                  ? "bg-ink-950 text-ink-0 dark:bg-ink-100 dark:text-ink-950"
                  : "text-ink-500 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-100")
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
            <Skeleton key={i} className="h-52 w-full rounded-card" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-sm text-ink-500 dark:text-ink-400">
          <StoreIcon className="mb-3 h-10 w-10 text-ink-300 dark:text-ink-700" />
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
