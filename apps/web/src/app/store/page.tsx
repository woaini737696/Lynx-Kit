import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { ProductGrid } from "@/components/store/product-grid";
import { SearchBar } from "@/components/store/search-bar";
import { CategoryFilter } from "@/components/store/category-filter";
import { STORE_PRODUCTS, STORE_CATEGORIES } from "@/components/store/data";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "LynxKit 商店",
  description:
    "由超级个体创造的 AI 应用商店 - 社交、CRM、BI、营销、IoT 等 8 大类 AI 应用任你挑选。",
  path: "/store",
  type: "website",
});

export default function StorePage() {
  const featured = STORE_PRODUCTS.filter((p) =>
    p.tags?.includes("热门"),
  ).slice(0, 4);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border bg-muted/30 py-16 sm:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                LynxKit 商店
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                由超级个体创造的 AI 应用，覆盖社交、CRM、BI、营销等 8 大场景
              </p>
            </div>

            <div className="mx-auto mt-8 max-w-2xl">
              <SearchBar placeholder="搜索应用、关键词、作者…" />
            </div>

            <div className="mt-6 flex justify-center">
              <CategoryFilter categories={STORE_CATEGORIES} />
            </div>
          </div>
        </section>

        {/* Featured */}
        {featured.length > 0 ? (
          <section className="py-16 sm:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                  <TrendingUp className="h-5 w-5 text-lynx-500" />
                  推荐商品
                </h2>
              </div>
              <ProductGrid products={featured} columns={4} />
            </div>
          </section>
        ) : null}

        {/* All products */}
        <section className="border-t border-border py-16 sm:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="mb-8 text-2xl font-bold tracking-tight">
              全部商品
            </h2>
            <ProductGrid products={STORE_PRODUCTS} columns={3} />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
