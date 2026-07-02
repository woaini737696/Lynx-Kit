import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { Pricing } from "@/components/marketing/pricing";
import { CTA } from "@/components/marketing/cta";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "定价",
  description:
    "LynxKit 提供免费、专业、团队三档定价方案，从个人尝鲜到团队协作，按需选择。",
  path: "/pricing",
});

const FAQS = [
  {
    q: "免费档有什么限制？",
    a: "免费档每月提供 5 次构建、本地优先 AI 推理和基础 Agent 流水线，无需信用卡即可开始。",
  },
  {
    q: "可以随时升级或降级吗？",
    a: "可以。所有方案都支持按月订阅、随时升级降级，已支付费用会按比例折算。",
  },
  {
    q: "团队版的席位如何计算？",
    a: "团队版默认包含 10 个席位，超出部分可按 ¥39 / 席位 / 月 加购。",
  },
  {
    q: "商店发布需要付费吗？",
    a: "免费档不能发布到商店，专业版与团队版均可免费发布，平台仅对交易额收取 5% 手续费。",
  },
];

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Pricing />

        <section className="border-t border-border py-24 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                常见问题
              </h2>
            </div>

            <div className="mx-auto mt-12 max-w-3xl space-y-4">
              {FAQS.map((f) => (
                <div
                  key={f.q}
                  className="rounded-xl border border-border bg-card p-5"
                >
                  <h3 className="font-semibold">{f.q}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
                </div>
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
