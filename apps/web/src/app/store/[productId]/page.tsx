import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Star,
  Download,
  ShoppingCart,
  Play,
  ArrowLeft,
  Calendar,
  Tag,
} from "lucide-react";
import { Button, Badge, Separator } from "@lynxkit/ui-web";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { STORE_PRODUCTS } from "@/components/store/data";
import { createMetadata } from "@/lib/seo";
import { formatPrice, formatCompactNumber, formatDate } from "@/lib/utils";

interface PageProps {
  params: Promise<{ productId: string }>;
}

/** SEO：预生成热门产品页 */
export async function generateStaticParams() {
  return STORE_PRODUCTS.map((p) => ({ productId: p.id }));
}

/** SEO：动态元数据 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { productId } = await params;
  const product = STORE_PRODUCTS.find((p) => p.id === productId);
  if (!product) {
    return createMetadata({
      title: "产品未找到",
      description: "您访问的产品不存在或已下架。",
      noIndex: true,
    });
  }
  return createMetadata({
    title: product.name,
    description: product.description,
    path: `/store/${product.id}`,
    type: "article",
  });
}

const REVIEWS = [
  {
    name: "用户A",
    rating: 5,
    date: "2025-12-20",
    content: "产品体验非常棒，开箱即用，文档也很完善。",
  },
  {
    name: "用户B",
    rating: 4,
    date: "2025-12-15",
    content: "功能强大，但 UI 还可以再打磨一下。",
  },
  {
    name: "用户C",
    rating: 5,
    date: "2025-12-10",
    content: "性价比很高，已经在生产环境用上了。",
  },
];

export default async function ProductDetailPage({ params }: PageProps) {
  const { productId } = await params;
  const product = STORE_PRODUCTS.find((p) => p.id === productId);
  if (!product) notFound();

  const related = STORE_PRODUCTS.filter(
    (p) => p.id !== product.id && p.category === product.category,
  ).slice(0, 4);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="border-b border-border">
          <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <Link
              href="/store"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              返回商店
            </Link>
          </div>
        </div>

        {/* 商品详情 */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
              {/* 左侧：截图 */}
              <div className="space-y-4">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted">
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-br from-lynx-500/20 via-violet-500/10 to-emerald-500/20"
                  />
                  <div className="flex h-full items-center justify-center">
                    <span className="text-6xl font-bold text-muted-foreground/30">
                      {product.name.slice(0, 2)}
                    </span>
                  </div>
                </div>
                {/* 缩略图列表（占位） */}
                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-md border border-border bg-muted"
                    />
                  ))}
                </div>
              </div>

              {/* 右侧：信息 */}
              <div className="flex flex-col">
                <div className="flex flex-wrap items-center gap-2">
                  {product.tags?.map((t) => (
                    <Badge key={t} className="bg-lynx-500/10 text-lynx-600 dark:text-lynx-400">
                      {t}
                    </Badge>
                  )) ?? null}
                  <Badge variant="secondary">{product.category}</Badge>
                </div>

                <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  {product.name}
                </h1>

                <p className="mt-3 text-lg text-muted-foreground">
                  {product.description}
                </p>

                {/* 评分 */}
                <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-lynx-500 text-lynx-500" />
                    <strong className="text-foreground">
                      {product.rating.toFixed(1)}
                    </strong>
                    （{product.downloads} 次下载）
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="h-4 w-4" />
                    {formatCompactNumber(product.downloads)}
                  </span>
                </div>

                <Separator className="my-6" />

                {/* 价格 */}
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold tracking-tight text-lynx-600 dark:text-lynx-400">
                    {product.price === 0 ? "免费" : formatPrice(product.price)}
                  </span>
                  {product.price > 0 ? (
                    <span className="text-sm text-muted-foreground">
                      一次性买断
                    </span>
                  ) : null}
                </div>

                {/* CTA */}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    size="lg"
                    className="flex-1 bg-lynx-500 text-white hover:bg-lynx-600"
                  >
                    <Link href={`/checkout/${product.id}`}>
                      <ShoppingCart className="h-4 w-4" />
                      立即购买
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="flex-1">
                    <Link href={`/try/${product.id}`}>
                      <Play className="h-4 w-4" />
                      试用
                    </Link>
                  </Button>
                </div>

                {/* 创作者 */}
                <Separator className="my-6" />
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    创作者
                  </h3>
                  <div className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-card p-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-lynx-500 to-lynx-600 text-lg font-semibold text-white">
                      {product.creator.name.slice(0, 1)}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold">{product.creator.name}</p>
                      <p className="text-xs text-muted-foreground">
                        LynxKit 认证创作者
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/creator/${product.creator.name}`}>
                        查看
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* 元信息 */}
                <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    发布于 2025-12-01
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Tag className="h-4 w-4" />
                    版本 v1.0.0
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </section>

        {/* 描述 / 评价 */}
        <section className="border-t border-border py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
              {/* 详细描述 */}
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold tracking-tight">产品介绍</h2>
                <div className="prose prose-sm mt-4 max-w-none text-muted-foreground">
                  <p>{product.description}</p>
                  <p className="mt-3">
                    这是一款由 LynxKit 平台生成的 AI 应用，使用 Next.js + Hono +
                    PostgreSQL 构建，开箱即用。源代码可在购买后导出，便于二次开发。
                  </p>
                  <ul className="mt-3 list-disc pl-5">
                    <li>基于 LynxKit 9 层 Agent 流水线生成</li>
                    <li>TypeScript strict + shadcn/ui 组件库</li>
                    <li>Docker 一键部署，自动 HTTPS</li>
                    <li>30 天无理由退款保证</li>
                  </ul>
                </div>
              </div>

              {/* 评价列表 */}
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  用户评价
                </h2>
                <div className="mt-4 space-y-4">
                  {REVIEWS.map((r) => (
                    <div
                      key={r.name}
                      className="rounded-lg border border-border bg-card p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{r.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(r.date)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={
                              i < r.rating
                                ? "h-3 w-3 fill-lynx-500 text-lynx-500"
                                : "h-3 w-3 text-muted-foreground/30"
                            }
                          />
                        ))}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {r.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 相关推荐 */}
        {related.length > 0 ? (
          <section className="border-t border-border py-12 sm:py-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold tracking-tight">
                相关推荐
              </h2>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((p) => (
                  <Link
                    key={p.id}
                    href={`/store/${p.id}`}
                    className="glow-card p-4"
                  >
                    <h3 className="font-semibold">{p.name}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {p.description}
                    </p>
                    <p className="mt-3 text-sm font-semibold text-lynx-600 dark:text-lynx-400">
                      {p.price === 0 ? "免费" : formatPrice(p.price)}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
