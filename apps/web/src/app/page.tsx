import { MessageSquare, Cpu, Rocket } from "lucide-react";
import { Navbar } from "@/components/marketing/navbar";
import { Hero } from "@/components/marketing/hero";
import { Features } from "@/components/marketing/features";
import { ProductTypes } from "@/components/marketing/product-types";
import { Pricing } from "@/components/marketing/pricing";
import { Testimonials } from "@/components/marketing/testimonials";
import { CTA } from "@/components/marketing/cta";
import { Footer } from "@/components/marketing/footer";

const STEPS = [
  {
    icon: <MessageSquare className="h-5 w-5" />,
    title: "描述你的想法",
    desc: "用自然语言告诉 AI 你想构建什么",
    step: "01",
  },
  {
    icon: <Cpu className="h-5 w-5" />,
    title: "AI 自动生成",
    desc: "9 层 Agent 协同产出完整代码与部署方案",
    step: "02",
  },
  {
    icon: <Rocket className="h-5 w-5" />,
    title: "部署上架",
    desc: "一键部署到云端，并可发布到妙想商店",
    step: "03",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-ink-950">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <ProductTypes />

        {/* HowItWorks —— 三步流程 · iOS26 极简 */}
        <section
          id="how-it-works"
          className="border-y border-ink-200/60 bg-ink-50/30 py-24 sm:py-32 dark:border-ink-800/60 dark:bg-ink-950/30"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                工作流程
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.02em] text-ink-950 sm:text-4xl md:text-5xl dark:text-ink-50">
                三步即可上线
              </h2>
              <p className="mt-4 text-lg text-ink-500 dark:text-ink-400">
                从想法到上线，只需几分钟
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
              {STEPS.map((s, idx) => (
                <div key={s.step} className="relative">
                  <div className="glow-card flex h-full flex-col p-6">
                    <div className="flex items-center justify-between">
                      {/* 黑色方块图标 */}
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-950 text-white shadow-sm dark:bg-ink-100 dark:text-ink-950">
                        {s.icon}
                      </span>
                      {/* 大序号 - 极简灰 */}
                      <span className="text-4xl font-bold tracking-[-0.04em] text-ink-200 dark:text-ink-700">
                        {s.step}
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold tracking-[-0.01em] text-ink-900 dark:text-ink-50">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">{s.desc}</p>
                  </div>
                  {/* 连接箭头 - 细线 */}
                  {idx < STEPS.length - 1 ? (
                    <div
                      aria-hidden
                      className="absolute -right-3 top-1/2 hidden h-px w-6 -translate-y-1/2 bg-ink-300 md:block dark:bg-ink-600"
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <Pricing />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
