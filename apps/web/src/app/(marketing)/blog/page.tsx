import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "博客",
  description: "妙想 团队博客 - AI 造物的最佳实践、案例与更新日志。",
  path: "/blog",
});

interface Post {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  readingTime: string;
}

const POSTS: Post[] = [
  {
    slug: "9-layer-agent-pipeline",
    title: "我们如何设计 9 层 Agent 流水线",
    excerpt:
      "从意图识别到一键部署，9 层 Agent 是如何协同工作的？本文拆解每一步的输入与产出。",
    date: "2025-12-15",
    category: "技术深度",
    readingTime: "12 分钟",
  },
  {
    slug: "local-first-ai",
    title: "本地优先 AI：用 Ollama 跑起 妙想",
    excerpt:
      "隐私优先、离线可用 —— 本文介绍如何在桌面端通过 Ollama 接入本地大模型。",
    date: "2025-12-08",
    category: "实践指南",
    readingTime: "8 分钟",
  },
  {
    slug: "store-launch",
    title: "妙想 商店正式上线",
    excerpt:
      "经过三个月内测，妙想 商店现已正式开放。来看看前 100 个 AI 应用长什么样。",
    date: "2025-11-28",
    category: "产品更新",
    readingTime: "5 分钟",
  },
  {
    slug: "super-individual",
    title: "超级个体的崛起：AI 时代的造物新范式",
    excerpt:
      "当一个人能完成过去一个团队的工作，组织形态会发生怎样的变化？",
    date: "2025-11-15",
    category: "思考",
    readingTime: "10 分钟",
  },
  {
    slug: "behind-the-scenes",
    title: "幕后：妙想 团队的工作方式",
    excerpt: "我们如何在 4 个月内构建一个跨端 AI 造物平台？工具栈、协作流程与踩坑实录。",
    date: "2025-11-01",
    category: "团队",
    readingTime: "15 分钟",
  },
  {
    slug: "pricing-update",
    title: "新定价方案详解",
    excerpt: "免费、专业、团队 —— 我们重新设计了定价，让更多独立开发者可以负担得起。",
    date: "2025-10-20",
    category: "产品更新",
    readingTime: "6 分钟",
  },
];

export default function BlogPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-border py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                妙想 博客
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                AI 造物的最佳实践、案例与团队思考
              </p>
            </div>
          </div>
        </section>

        <section className="py-24 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {POSTS.map((post) => (
                <article
                  key={post.slug}
                  className="group glow-card flex flex-col p-6"
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="rounded-md bg-lynx-500/10 px-2 py-0.5 font-medium text-lynx-600 dark:text-lynx-400">
                      {post.category}
                    </span>
                    <span>{post.readingTime}</span>
                  </div>

                  <h2 className="mt-4 text-lg font-semibold leading-snug">
                    {post.title}
                  </h2>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">
                    {post.excerpt}
                  </p>

                  <div className="mt-5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {post.date}
                    </span>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-lynx-600 transition-colors hover:text-lynx-500 dark:text-lynx-400"
                    >
                      阅读全文
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
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
