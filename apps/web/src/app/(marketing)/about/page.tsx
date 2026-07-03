import type { Metadata } from "next";
import { Sparkles, Target, Users, Globe } from "lucide-react";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { CTA } from "@/components/marketing/cta";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "关于我们",
  description:
    "妙想 是一支由 AI 爱好者组成的团队，致力于让每个人都能成为超级个体。",
  path: "/about",
});

const VALUES = [
  {
    icon: <Target className="h-5 w-5" />,
    title: "使命",
    desc: "让每个人都拥有把想法变成产品的能力。",
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: "团队",
    desc: "来自一线互联网公司的工程师、设计师与产品经理。",
  },
  {
    icon: <Globe className="h-5 w-5" />,
    title: "愿景",
    desc: "构建 AI 时代的造物基础设施，让人人都是造物主。",
  },
];

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-border py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-lynx-500/30 bg-lynx-500/10 px-3 py-1 text-sm text-lynx-600 dark:text-lynx-400">
                <Sparkles className="h-3.5 w-3.5" />
                关于 妙想
              </span>
              <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
                让人人都是造物主
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                我们相信 AI 时代的核心不是技术本身，而是把技术交到每个人手中。
                妙想 是我们献给所有"想做点什么"的人的工具。
              </p>
            </div>
          </div>
        </section>

        <section className="py-24 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {VALUES.map((v) => (
                <article key={v.title} className="glow-card p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-lynx-500/10 text-lynx-500">
                    {v.icon}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{v.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <CTA />
      </main>
      <Footer />
    </div>
  );
}
