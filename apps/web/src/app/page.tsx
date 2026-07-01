import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Layers,
  Rocket,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";

import { APP_CONFIG, PRODUCT_TYPES } from "@lynxkit/shared";

import { Button } from "@/components/ui/button";

// 三个核心特性
const FEATURES = [
  {
    icon: Layers,
    title: "架构透明",
    description:
      "生成可见的、可读的、可改的源码。不锁死供应商，你的产品你完全拥有。",
  },
  {
    icon: Sparkles,
    title: "模板优先",
    description:
      "6 类产品模板覆盖官网、预约、内容、电商、活动、后台，意图识别自动选型。",
  },
  {
    icon: ShieldCheck,
    title: "零运维",
    description:
      "Docker + Caddy 自动化部署到你自己的服务器，L1 自修复 + L2 引导修复。",
  },
] as const;

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-40 border-b border-zinc-100 bg-white/80 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lynx-500 text-white">
              <Boxes className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold text-zinc-900">
              {APP_CONFIG.name}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">登录</Link>
            </Button>
            <Button asChild>
              <Link href="/register">免费注册</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-lynx-50 via-white to-white" />
          <div className="absolute left-1/2 top-0 -z-10 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-lynx-200/30 blur-3xl" />
          <div className="mx-auto max-w-6xl px-4 py-24 text-center md:px-6 md:py-32">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-lynx-200 bg-lynx-50 px-4 py-1.5 text-sm font-medium text-lynx-700 animate-fade-in">
              <Rocket className="h-4 w-4" />
              原生双端 AI 产品构建平台
            </div>
            <h1 className="bg-gradient-to-br from-zinc-900 to-zinc-700 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent md:text-7xl animate-slide-up">
              {APP_CONFIG.tagline}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600 md:text-xl animate-slide-up">
              不会代码，也能独立做产品。从想法到上线，LynxKit 用 AI 帮你把产品造出来。
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row animate-slide-up">
              <Button size="lg" asChild>
                <Link href="/register">
                  立即开始
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">已有账号，登录</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* 特性介绍 */}
        <section className="mx-auto max-w-6xl px-4 py-20 md:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-zinc-900 md:text-4xl">
              为什么选择 LynxKit
            </h2>
            <p className="mt-3 text-zinc-600">
              把复杂留给自己，把简单交给你
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-zinc-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-lynx-50 text-lynx-600">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 text-xl font-semibold text-zinc-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 产品类型展示 */}
        <section className="border-t border-zinc-100 bg-zinc-50/50 py-20">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold text-zinc-900 md:text-4xl">
                6 类产品，覆盖独立开发者全部场景
              </h2>
              <p className="mt-3 text-zinc-600">
                告诉我你想做什么，剩下交给我们
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {PRODUCT_TYPES.map((product) => (
                <div
                  key={product.id}
                  className="group relative overflow-hidden rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  <div
                    className="absolute right-0 top-0 h-24 w-24 rounded-bl-full opacity-10 transition-opacity group-hover:opacity-20"
                    style={{ backgroundColor: product.color }}
                  />
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: product.color }}
                  >
                    <Wrench className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-zinc-900">
                    {product.name}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
                    {product.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {product.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row md:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-lynx-500 text-white">
              <Boxes className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold text-zinc-900">
              {APP_CONFIG.name}
            </span>
            <span className="text-sm text-zinc-400">· {APP_CONFIG.tagline}</span>
          </div>
          <p className="text-xs text-zinc-400">
            © {new Date().getFullYear()} {APP_CONFIG.name}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
