import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  Download,
  ShoppingCart,
  Loader2,
  ExternalLink,
  GitBranch,
} from "lucide-react";
import { TryDemoModal } from "@/components/store/try-demo-modal";
import {
  Card,
  CardContent,
  Button,
  Badge,
  Skeleton,
  Separator,
  toast,
} from "@lynxkit/ui-web";
import { storeApi } from "@/lib/api";
import { formatPrice, formatDateTime } from "@/lib/utils";
import type { StoreProduct, Review } from "@lynxkit/shared";

export default function ProductDetailPage() {
  const params = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const productId = params.productId!;
  const [product, setProduct] = React.useState<StoreProduct | null>(null);
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [purchasing, setPurchasing] = React.useState(false);

  React.useEffect(() => {
    Promise.all([storeApi.getById(productId), storeApi.listReviews(productId)])
      .then(([p, r]) => {
        setProduct(p);
        setReviews(r);
      })
      .catch(() => toast({ title: "加载产品失败", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [productId]);

  const purchase = async () => {
    setPurchasing(true);
    try {
      await storeApi.purchase({
        productId,
        type: product?.price === 0 ? "purchase" : "purchase",
        paymentMethod: "alipay",
      });
      toast({ title: "购买成功 🎉", variant: "success" });
    } catch (e) {
      toast({
        title: "购买失败",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <Skeleton className="h-72 w-full rounded-card" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="px-6 py-20 text-center text-ink-500 dark:text-ink-400">
        产品不存在或已下架
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/store")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        返回商店
      </Button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 主信息 */}
        <div className="lg:col-span-2">
          <div className="glass-card overflow-hidden">
            <div className="flex h-48 items-center justify-center bg-ink-100 dark:bg-ink-900">
              {product.coverUrl ? (
                <img
                  src={product.coverUrl}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <ShoppingCart className="h-12 w-12 text-ink-300 dark:text-ink-700" />
              )}
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-ink-950 dark:text-ink-0">{product.name}</h1>
                  <div className="mt-1 flex items-center gap-2 text-sm text-ink-500 dark:text-ink-400">
                    <span className="inline-flex items-center gap-0.5">
                      <Star className="h-3.5 w-3.5 text-ink-700 dark:text-ink-300" />
                      {product.ratingAvg.toFixed(1)}
                      <span className="opacity-60">({product.ratingCount})</span>
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                      <Download className="h-3.5 w-3.5" />
                      {product.downloadCount}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      v{product.version}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-ink-950 dark:text-ink-0">
                    {product.price === 0 ? "免费" : formatPrice(product.price)}
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="whitespace-pre-wrap text-sm text-ink-600 dark:text-ink-400">
                  {product.readme ?? product.description}
                </p>
              </div>

              {product.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {product.tags.map((t) => (
                    <Badge key={t} variant="outline" className="text-[10px]">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center gap-4 text-xs text-ink-500 dark:text-ink-400">
                <span>更新于 {formatDateTime(product.updatedAt)}</span>
                {product.repoUrl && (
                  <a
                    href={product.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-ink-950 dark:hover:text-ink-100"
                  >
                    <GitBranch className="h-3 w-3" />
                    源码仓库
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* 评价 */}
          <div className="glass-card mt-4">
            <div className="p-5">
              <h2 className="mb-3 text-sm font-semibold text-ink-900 dark:text-ink-100">
                评价 ({reviews.length})
              </h2>
              {reviews.length === 0 ? (
                <p className="py-6 text-center text-sm text-ink-500 dark:text-ink-400">
                  暂无评价
                </p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((r) => (
                    <div key={r.id} className="border-b border-ink-200/60 pb-3 last:border-0 dark:border-ink-800/60">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={
                                i < r.rating
                                  ? "h-3.5 w-3.5 text-ink-950 dark:text-ink-100"
                                  : "h-3.5 w-3.5 text-ink-300 dark:text-ink-700"
                              }
                            />
                          ))}
                        </div>
                        <span className="text-xs text-ink-500 dark:text-ink-400">
                          {formatDateTime(r.createdAt)}
                        </span>
                      </div>
                      {r.content && (
                        <p className="mt-1 text-sm text-ink-800 dark:text-ink-200">{r.content}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 侧边购买栏 */}
        <div className="lg:col-span-1">
          <div className="glass-card sticky top-4">
            <div className="space-y-3 p-5">
              <TryDemoModal demoUrl={product.demoUrl} productName={product.name} />
              <button
                className="btn-ink w-full justify-center text-sm"
                onClick={purchase}
                disabled={purchasing}
              >
                {purchasing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingCart className="mr-2 h-4 w-4" />
                )}
                {product.price === 0 ? "免费获取" : "立即购买"}
              </button>
              {product.demoUrl && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(product.demoUrl, "_blank")}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  访问演示
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
