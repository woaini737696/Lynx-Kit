import Link from "next/link";
import { ArrowRight, Sparkles, Play } from "lucide-react";
import { Button } from "@lynxkit/ui-web";

/**
 * 营销首页 Hero
 *
 * - 大标题（渐变文字）
 * - 副标题
 * - 两个 CTA："免费开始构建" + "查看示例"
 * - 背景：渐变 + 网格底 + 浮动粒子（CSS）
 */
export function Hero() {
  return (
    <section className="hero-glow relative overflow-hidden">
      {/* 网格底纹 */}
      <div
        aria-hidden
        className="grid-bg pointer-events-none absolute inset-0 opacity-50"
      />

      {/* 浮动粒子 */}
      <Particles />

      <div className="container relative z-10 mx-auto px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          {/* 徽章 */}
          <div className="mb-6 inline-flex animate-fade-in items-center gap-2 rounded-full border border-lynx-500/30 bg-lynx-500/10 px-4 py-1.5 text-sm font-medium text-lynx-600 dark:text-lynx-400">
            <Sparkles className="h-3.5 w-3.5" />
            9 层 Agent 流水线 · 一句话到上线
          </div>

          {/* 大标题 */}
          <h1 className="animate-slide-up text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            AI 时代，<br className="sm:hidden" />
            <span className="text-gradient">人人都是造物主</span>
          </h1>

          {/* 副标题 */}
          <p className="mt-6 max-w-2xl animate-slide-up text-base text-muted-foreground sm:text-lg md:text-xl">
            一句话描述你的想法，9 层 Agent 流水线帮你完成架构、设计、代码、部署，
            从想法到上线只需一杯咖啡的时间。
          </p>

          {/* CTA */}
          <div className="mt-10 flex w-full animate-slide-up flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              asChild
              size="lg"
              className="w-full bg-lynx-500 text-white shadow-lg shadow-lynx-500/30 hover:bg-lynx-600 sm:w-auto"
            >
              <Link href="/register">
                免费开始构建
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Link href="/store">
                <Play className="h-4 w-4" />
                查看示例
              </Link>
            </Button>
          </div>

          {/* 信任徽章 */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              永久免费档
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-lynx-500" />
              无需信用卡
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
              支持本地部署
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/** 装饰性浮动粒子 */
function Particles() {
  const particles = [
    { left: "10%", top: "20%", size: 6, delay: "0s", color: "bg-lynx-500/40" },
    { left: "25%", top: "60%", size: 4, delay: "2s", color: "bg-violet-500/40" },
    { left: "45%", top: "30%", size: 8, delay: "4s", color: "bg-lynx-400/40" },
    { left: "65%", top: "70%", size: 5, delay: "1s", color: "bg-emerald-500/40" },
    { left: "80%", top: "25%", size: 7, delay: "3s", color: "bg-lynx-500/40" },
    { left: "92%", top: "55%", size: 4, delay: "5s", color: "bg-amber-500/40" },
    { left: "15%", top: "85%", size: 6, delay: "2.5s", color: "bg-lynx-300/40" },
    { left: "55%", top: "15%", size: 5, delay: "4.5s", color: "bg-sky-500/40" },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {particles.map((p, i) => (
        <span
          key={i}
          className={`particle ${p.color}`}
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
}
