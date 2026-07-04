import { Link } from "react-router-dom";
import { Star, Download, ShoppingCart } from "lucide-react";
import { Badge } from "@lynxkit/ui-web";
import { cn, formatPrice } from "@/lib/utils";
import type { StoreProduct } from "@lynxkit/shared";

interface ProductCardProps {
  product: StoreProduct;
  className?: string;
}

const PRICING_LABEL: Record<string, string> = {
  free: "免费",
  onetime: "买断",
  subscription: "订阅",
  usage: "按量",
};

/**
 * 商店产品卡片
 */
export function ProductCard({ product, className }: ProductCardProps) {
  return (
    <Link to={`/store/${product.id}`} className="block">
      <div
        className={cn(
          "glass-card h-full overflow-hidden transition-all duration-200 hover:-translate-y-px",
          className,
        )}
      >
        <div className="flex h-32 items-center justify-center bg-ink-100 dark:bg-ink-900">
          {product.coverUrl ? (
            <img
              src={product.coverUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <ShoppingCart className="h-8 w-8 text-ink-300 dark:text-ink-700" />
          )}
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-ink-900 dark:text-ink-100">{product.name}</h3>
            <Badge variant="outline" className="shrink-0 text-[10px]">
              {PRICING_LABEL[product.pricingType] ?? product.pricingType}
            </Badge>
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-ink-500 dark:text-ink-400">
            {product.description}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm font-bold text-ink-950 dark:text-ink-0">
              {product.price === 0 ? "免费" : formatPrice(product.price)}
            </span>
            <div className="flex items-center gap-2 text-xs text-ink-500 dark:text-ink-400">
              <span className="inline-flex items-center gap-0.5">
                <Star className="h-3 w-3 text-ink-700 dark:text-ink-300" />
                {product.ratingAvg.toFixed(1)}
              </span>
              <span className="inline-flex items-center gap-0.5">
                <Download className="h-3 w-3" />
                {product.downloadCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
