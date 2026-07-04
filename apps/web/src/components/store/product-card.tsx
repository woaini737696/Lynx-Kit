import Link from "next/link";
import { Star, Download } from "lucide-react";
import { Badge } from "@lynxkit/ui-web";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface Product {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  price: number;
  rating: number;
  downloads: number;
  category: string;
  creator: {
    name: string;
    avatar?: string;
  };
  tags?: string[];
}

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  return (
    <Link
      href={`/store/${product.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-ink-200/60 bg-white/55 backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-ink-300 hover:bg-white/72 hover:shadow-lg dark:border-ink-800/60 dark:bg-white/5 dark:hover:border-ink-600 dark:hover:bg-white/10",
        className,
      )}
    >
      {/* 缩略图 - 极简灰 */}
      <div className="relative aspect-[16/10] overflow-hidden bg-ink-100 dark:bg-ink-900">
        <div className="flex h-full items-center justify-center p-6">
          <span className="text-4xl font-bold tracking-[-0.04em] text-ink-300 dark:text-ink-700">
            {product.name.slice(0, 2)}
          </span>
        </div>
        {product.tags?.[0] ? (
          <Badge className="absolute left-3 top-3 rounded-full bg-ink-950 px-2.5 py-1 text-xs font-medium text-white dark:bg-ink-100 dark:text-ink-950">
            {product.tags[0]}
          </Badge>
        ) : null}
      </div>

      {/* 内容 */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 font-semibold tracking-[-0.01em] text-ink-900 dark:text-ink-50">
          {product.name}
        </h3>
        <p className="mt-1 line-clamp-2 flex-1 text-sm text-ink-500 dark:text-ink-400">
          {product.description}
        </p>

        {/* 评分 + 下载 */}
        <div className="mt-3 flex items-center gap-3 text-xs text-ink-500 dark:text-ink-400">
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-ink-950 text-ink-950 dark:fill-ink-100 dark:text-ink-100" />
            {product.rating.toFixed(1)}
          </span>
          <span className="flex items-center gap-1">
            <Download className="h-3.5 w-3.5" />
            {product.downloads.toLocaleString()}
          </span>
          <span className="ml-auto text-ink-400 dark:text-ink-500">{product.category}</span>
        </div>

        {/* 价格 + 作者 */}
        <div className="mt-3 flex items-center justify-between border-t border-ink-200/60 pt-3 dark:border-ink-800/60">
          <span className="flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink-950 text-[10px] font-semibold text-white dark:bg-ink-100 dark:text-ink-950">
              {product.creator.name.slice(0, 1)}
            </span>
            {product.creator.name}
          </span>
          <span className="font-semibold text-ink-950 dark:text-ink-50">
            {product.price === 0 ? "免费" : formatPrice(product.price)}
          </span>
        </div>
      </div>
    </Link>
  );
}
