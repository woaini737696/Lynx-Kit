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
    desc: "一键部署到云端，并可发布到 LynxKit 商店",
    step: "03",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <ProductTypes />

        {/* HowItWorks —— 三步流程 */}
        <section id="how-it-works" className="border-y border-border bg-muted/30 py-24 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-lynx-500">
                工作流程
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                三步即可上线
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                从想法到上线，只需几分钟
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
              {STEPS.map((s, idx) => (
                <div key={s.step} className="relative">
                  <div className="flex h-full flex-col rounded-xl border border-border bg-card p-6">
                    <div className="flex items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-lynx-500/10 text-lynx-500">
                        {s.icon}
                      </span>
                      <span className="text-3xl font-bold text-muted-foreground/20">
                        {s.step}
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {s.desc}
                    </p>
                  </div>
                  {/* 连接箭头 */}
                  {idx < STEPS.length - 1 ? (
                    <div
                      aria-hidden
                      className="absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 items-center justify-center text-lynx-500 md:flex"
                    >
                      →
                    </div>
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
