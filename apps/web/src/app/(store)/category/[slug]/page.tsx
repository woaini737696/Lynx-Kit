import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { ProductGrid } from "@/components/store/product-grid";
import { STORE_PRODUCTS, STORE_CATEGORIES } from "@/components/store/data";
import { createMetadata } from "@/lib/seo";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** SEO：预生成每个分类页 */
export async function generateStaticParams() {
  return STORE_CATEGORIES.filter((c) => c.slug !== "all").map((c) => ({
    slug: encodeURIComponent(c.slug),
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const category = STORE_CATEGORIES.find((c) => c.slug === decoded);
  if (!category) {
    return createMetadata({
      title: "分类未找到",
      description: "您访问的分类不存在。",
      noIndex: true,
    });
  }
  return createMetadata({
    title: `${category.name} - LynxKit 商店`,
    description: `浏览 ${category.name} 分类的 AI 应用，由超级个体创造。`,
    path: `/store/category/${slug}`,
  });
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const category = STORE_CATEGORIES.find((c) => c.slug === decoded);
  if (!category) notFound();

  const products = STORE_PRODUCTS.filter((p) => p.category === decoded);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-border bg-muted/30 py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-sm text-muted-foreground">
              <a href="/store" className="hover:text-foreground">
                商店
              </a>{" "}
              / {category.name}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              {category.name}
            </h1>
            <p className="mt-2 text-muted-foreground">
              共 {products.length} 个应用
            </p>
          </div>
        </section>

        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <ProductGrid products={products} columns={3} />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
