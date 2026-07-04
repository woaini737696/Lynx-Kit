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

export async function generateStaticParams() {
  return STORE_PRODUCTS.map((p) => ({ productId: p.id }));
}

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
  { name: "用户A", rating: 5, date: "2025-12-20", content: "产品体验非常棒，开箱即用，文档也很完善。" },
  { name: "用户B", rating: 4, date: "2025-12-15", content: "功能强大，但 UI 还可以再打磨一下。" },
  { name: "用户C", rating: 5, date: "2025-12-10", content: "性价比很高，已经在生产环境用上了。" },
];

export default async function ProductDetailPage({ params }: PageProps) {
  const { productId } = await params;
  const product = STORE_PRODUCTS.find((p) => p.id === productId);
  if (!product) notFound();

  const related = STORE_PRODUCTS.filter(
    (p) => p.id !== product.id && p.category === product.category,
  ).slice(0, 4);

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-ink-950">
      <Navbar />
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="border-b border-ink-200/60 dark:border-ink-800/60">
          <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <Link
              href="/store"
              className="inline-flex items-center gap-1 text-sm text-ink-500 transition-colors hover:text-ink-950 dark:hover:text-ink-50"
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
              {/* 左侧：截图 - 玻璃质感 */}
              <div className="space-y-4">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-ink-200/60 bg-ink-100 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-900">
                  <div className="flex h-full items-center justify-center">
                    <span className="text-6xl font-bold tracking-[-0.04em] text-ink-300 dark:text-ink-700">
                      {product.name.slice(0, 2)}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-xl border border-ink-200/60 bg-ink-50 dark:border-ink-800/60 dark:bg-ink-900"
                    />
                  ))}
                </div>
              </div>

              {/* 右侧：信息 */}
              <div className="flex flex-col">
                <div className="flex flex-wrap items-center gap-2">
                  {product.tags?.map((t) => (
                    <Badge
                      key={t}
                      className="rounded-full border border-ink-200 bg-white/55 px-2.5 py-1 text-xs text-ink-700 backdrop-blur-xl dark:border-ink-700 dark:bg-white/10 dark:text-ink-200"
                    >
                      {t}
                    </Badge>
                  )) ?? null}
                  <Badge className="rounded-full bg-ink-100 px-2.5 py-1 text-xs text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                    {product.category}
                  </Badge>
                </div>

                <h1 className="mt-3 text-3xl font-bold tracking-[-0.02em] text-ink-950 sm:text-4xl dark:text-ink-50">
                  {product.name}
                </h1>

                <p className="mt-3 text-lg text-ink-500 dark:text-ink-400">{product.description}</p>

                {/* 评分 */}
                <div className="mt-4 flex items-center gap-4 text-sm text-ink-500 dark:text-ink-400">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-ink-950 text-ink-950 dark:fill-ink-100 dark:text-ink-100" />
                    <strong className="text-ink-900 dark:text-ink-50">
                      {product.rating.toFixed(1)}
                    </strong>
                    （{product.downloads} 次下载）
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="h-4 w-4" />
                    {formatCompactNumber(product.downloads)}
                  </span>
                </div>

                <Separator className="my-6 bg-ink-200/60 dark:bg-ink-700/60" />

                {/* 价格 */}
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-[-0.03em] text-ink-950 dark:text-ink-50">
                    {product.price === 0 ? "免费" : formatPrice(product.price)}
                  </span>
                  {product.price > 0 ? (
                    <span className="text-sm text-ink-500 dark:text-ink-400">一次性买断</span>
                  ) : null}
                </div>

                {/* CTA - 黑色主按钮 + 玻璃次按钮 */}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    size="lg"
                    className="flex-1 rounded-full bg-ink-950 text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)] hover:bg-ink-800 dark:bg-ink-100 dark:text-ink-950 dark:hover:bg-ink-200"
                  >
                    <Link href={`/checkout/${product.id}`}>
                      <ShoppingCart className="h-4 w-4" />
                      立即购买
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="flex-1 rounded-full border-ink-200 bg-white/55 text-ink-900 backdrop-blur-xl hover:bg-white/72 dark:border-ink-700 dark:bg-white/10 dark:text-ink-50 dark:hover:bg-white/20"
                  >
                    <Link href={`/try/${product.id}`}>
                      <Play className="h-4 w-4" />
                      试用
                    </Link>
                  </Button>
                </div>

                {/* 创作者 */}
                <Separator className="my-6 bg-ink-200/60 dark:bg-ink-700/60" />
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-500 dark:text-ink-400">
                    创作者
                  </h3>
                  <div className="mt-3 flex items-center gap-3 rounded-2xl border border-ink-200/60 bg-white/55 p-4 backdrop-blur-xl dark:border-ink-800/60 dark:bg-white/5">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-950 text-lg font-semibold text-white dark:bg-ink-100 dark:text-ink-950">
                      {product.creator.name.slice(0, 1)}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-ink-900 dark:text-ink-50">
                        {product.creator.name}
                      </p>
                      <p className="text-xs text-ink-500 dark:text-ink-400">妙想认证创作者</p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/creator/${product.creator.name}`}>查看</Link>
                    </Button>
                  </div>
                </div>

                {/* 元信息 */}
                <dl className="mt-6 grid grid-cols-2 gap-3 text-sm text-ink-500 dark:text-ink-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    发布于 2025-12-01
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    版本 v1.0.0
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </section>

        {/* 描述 / 评价 */}
        <section className="border-t border-ink-200/60 py-12 sm:py-16 dark:border-ink-800/60">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
              {/* 详细描述 */}
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold tracking-[-0.02em] text-ink-950 dark:text-ink-50">
                  产品介绍
                </h2>
                <div className="prose prose-sm mt-4 max-w-none text-ink-600 dark:text-ink-300">
                  <p>{product.description}</p>
                  <p className="mt-3">
                    这是一款由妙想平台生成的 AI 应用，使用 Next.js + Hono +
                    PostgreSQL 构建，开箱即用。源代码可在购买后导出，便于二次开发。
                  </p>
                  <ul className="mt-3 list-disc pl-5">
                    <li>基于妙想 9 层 Agent 流水线生成</li>
                    <li>TypeScript strict + shadcn/ui 组件库</li>
                    <li>Docker 一键部署，自动 HTTPS</li>
                    <li>30 天无理由退款保证</li>
                  </ul>
                </div>
              </div>

              {/* 评价列表 - 玻璃卡片 */}
              <div>
                <h2 className="text-2xl font-bold tracking-[-0.02em] text-ink-950 dark:text-ink-50">
                  用户评价
                </h2>
                <div className="mt-4 space-y-4">
                  {REVIEWS.map((r) => (
                    <div
                      key={r.name}
                      className="rounded-2xl border border-ink-200/60 bg-white/55 p-4 backdrop-blur-xl dark:border-ink-800/60 dark:bg-white/5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-ink-900 dark:text-ink-50">
                          {r.name}
                        </span>
                        <span className="text-xs text-ink-500 dark:text-ink-400">
                          {formatDate(r.date)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={
                              i < r.rating
                                ? "h-3 w-3 fill-ink-950 text-ink-950 dark:fill-ink-100 dark:text-ink-100"
                                : "h-3 w-3 text-ink-300 dark:text-ink-700"
                            }
                          />
                        ))}
                      </div>
                      <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">{r.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 相关推荐 */}
        {related.length > 0 ? (
          <section className="border-t border-ink-200/60 py-12 sm:py-16 dark:border-ink-800/60">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold tracking-[-0.02em] text-ink-950 dark:text-ink-50">
                相关推荐
              </h2>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((p) => (
                  <Link
                    key={p.id}
                    href={`/store/${p.id}`}
                    className="glow-card p-4"
                  >
                    <h3 className="font-semibold tracking-[-0.01em] text-ink-900 dark:text-ink-50">
                      {p.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs text-ink-500 dark:text-ink-400">
                      {p.description}
                    </p>
                    <p className="mt-3 text-sm font-semibold text-ink-950 dark:text-ink-50">
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
