"use client";

import Link from "next/link";
import { Star, Download, ShoppingCart } from "lucide-react";
import {
  Card,
  CardContent,
  Badge,
} from "@lynxkit/ui-web";
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
    <Link href={`/store/${product.id}`} className="block">
      <Card
        className={cn(
          "h-full cursor-pointer overflow-hidden transition hover:border-lynx-500/50 hover:shadow-md",
          className,
        )}
      >
        <div className="flex h-32 items-center justify-center bg-gradient-to-br from-lynx-500/15 to-lynx-400/5">
          {product.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.coverUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <ShoppingCart className="h-8 w-8 text-lynx-500/40" />
          )}
        </div>
        <CardContent className="p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-semibold">{product.name}</h3>
            <Badge variant="outline" className="shrink-0 text-[10px]">
              {PRICING_LABEL[product.pricingType] ?? product.pricingType}
            </Badge>
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {product.description}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm font-bold text-lynx-600">
              {product.price === 0 ? "免费" : formatPrice(product.price)}
            </span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-0.5">
                <Star className="h-3 w-3 text-yellow-500" />
                {product.ratingAvg.toFixed(1)}
              </span>
              <span className="inline-flex items-center gap-0.5">
                <Download className="h-3 w-3" />
                {product.downloadCount}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
