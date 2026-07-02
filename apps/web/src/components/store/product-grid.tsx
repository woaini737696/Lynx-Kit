import { cn } from "@/lib/utils";
import { ProductCard, type Product } from "./product-card";

interface ProductGridProps {
  products: Product[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function ProductGrid({
  products,
  columns = 3,
  className,
}: ProductGridProps) {
  const cols = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  }[columns];

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
        <p className="text-muted-foreground">暂无商品</p>
        <p className="mt-1 text-sm text-muted-foreground/70">
          请尝试调整筛选条件或搜索关键词
        </p>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 gap-5", cols, className)}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
