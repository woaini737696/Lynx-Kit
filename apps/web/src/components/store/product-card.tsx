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
  price: number; // 单位：分
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
        "group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-lynx-500/50 hover:shadow-lg",
        className,
      )}
    >
      {/* 缩略图 */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-lynx-500/10 via-transparent to-violet-500/10"
        />
        <div className="flex h-full items-center justify-center p-6">
          <span className="text-4xl font-bold text-muted-foreground/40">
            {product.name.slice(0, 2)}
          </span>
        </div>
        {product.tags?.[0] ? (
          <Badge className="absolute left-3 top-3 bg-lynx-500 text-white">
            {product.tags[0]}
          </Badge>
        ) : null}
      </div>

      {/* 内容 */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 font-semibold">{product.name}</h3>
        <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">
          {product.description}
        </p>

        {/* 评分 + 下载 */}
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-lynx-500 text-lynx-500" />
            {product.rating.toFixed(1)}
          </span>
          <span className="flex items-center gap-1">
            <Download className="h-3.5 w-3.5" />
            {product.downloads.toLocaleString()}
          </span>
          <span className="ml-auto text-muted-foreground/60">
            {product.category}
          </span>
        </div>

        {/* 价格 + 作者 */}
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-lynx-500 to-lynx-600 text-[10px] font-semibold text-white">
              {product.creator.name.slice(0, 1)}
            </span>
            {product.creator.name}
          </span>
          <span className="font-semibold text-lynx-600 dark:text-lynx-400">
            {product.price === 0 ? "免费" : formatPrice(product.price)}
          </span>
        </div>
      </div>
    </Link>
  );
}
