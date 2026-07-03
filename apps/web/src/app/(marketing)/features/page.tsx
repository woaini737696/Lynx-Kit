import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Check } from "lucide-react";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { Features } from "@/components/marketing/features";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "功能介绍",
  description:
    "妙想 提供意图识别、架构生成、一键部署三大核心能力，9 层 Agent 流水线从一句话到上线。",
  path: "/features",
});

const CAPABILITIES = [
  {
    title: "9 层 Agent 流水线",
    desc: "意图 → 架构 → 澄清 → 产品 → 设计 → 前端 → 后端 → AI 集成 → 测试部署，全流程自动化。",
    points: ["可中断、可回滚", "对话式调试", "决策可审"],
  },
  {
    title: "AI 模型自由切换",
    desc: "支持 OpenAI、Anthropic、Gemini、本地 Ollama，按场景选择最合适的模型。",
    points: ["云端 + 本地混合", "连通性自检", "Token 用量追踪"],
  },
  {
    title: "代码完全可控",
    desc: "所有产物都是标准 Next.js + Hono + PostgreSQL，导出后可继续在 IDE 中维护。",
    points: ["TypeScript strict", "shadcn/ui 组件", "Drizzle ORM"],
  },
  {
    title: "一键部署到云端",
    desc: "Docker + Caddy 容器化部署，自动 HTTPS、自动回滚，分钟级上线。",
    points: ["多区域部署", "健康检查", "蓝绿发布"],
  },
];

export default function FeaturesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-border py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                全流程 AI 协作
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                从想法到上线，每一步都有 AI 协同，但决策权始终在你手中
              </p>
            </div>
          </div>
        </section>

        <Features />

        <section className="py-24 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                进阶能力
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                妙想 不仅是代码生成器，更是完整的造物平台
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2">
              {CAPABILITIES.map((c) => (
                <article
                  key={c.title}
                  className="glow-card p-6"
                >
                  <h3 className="text-xl font-semibold">{c.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
                  <ul className="mt-4 space-y-2">
                    {c.points.map((p) => (
                      <li
                        key={p}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <Check className="h-4 w-4 text-lynx-500" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
