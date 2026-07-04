import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@lynxkit/ui-web";

/**
 * 营销首页 Hero · iOS26 极简黑白灰
 *
 * - 徽章（毛玻璃 + 黑色脉冲点）
 * - 大标题（黑色加粗，字距 -0.04em）
 * - 副标题
 * - 两个 CTA：黑色主按钮 + 玻璃质感次按钮
 * - 信任徽章
 */
export function Hero() {
  return (
    <section className="hero-glow relative overflow-hidden">
      {/* 网格底纹 - 极简灰 */}
      <div aria-hidden className="grid-bg pointer-events-none absolute inset-0 opacity-40" />

      {/* 浮动粒子 - 统一灰白色 */}
      <Particles />

      <div className="container relative z-10 mx-auto px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          {/* 毛玻璃徽章 */}
          <div className="mb-6 inline-flex animate-fade-in items-center gap-2 rounded-full border border-white/70 bg-white/55 px-4 py-1.5 text-sm font-medium text-ink-700 backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/10 dark:text-ink-200">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ink-950 opacity-60 dark:bg-ink-100" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-ink-950 dark:bg-ink-100" />
            </span>
            9 层 Agent 流水线 · 一句话到上线
          </div>

          {/* 大标题 - 极简黑 */}
          <h1 className="animate-slide-up text-4xl font-bold tracking-[-0.04em] text-ink-950 sm:text-5xl md:text-6xl lg:text-7xl dark:text-ink-50">
            AI 时代，
            <br className="sm:hidden" />
            <span className="text-gradient">人人都是造物主</span>
          </h1>

          {/* 副标题 */}
          <p className="mt-6 max-w-2xl animate-slide-up text-base text-ink-500 sm:text-lg md:text-xl dark:text-ink-400">
            一句话描述你的想法，9 层 Agent 流水线帮你完成架构、设计、代码、部署，
            从想法到上线只需一杯咖啡的时间。
          </p>

          {/* CTA - 黑色主按钮 + 玻璃次按钮 */}
          <div className="mt-10 flex w-full animate-slide-up flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              asChild
              size="lg"
              className="w-full rounded-full bg-ink-950 px-6 text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)] transition-all hover:bg-ink-800 hover:translate-y-[-1px] sm:w-auto dark:bg-ink-100 dark:text-ink-950 dark:hover:bg-ink-200"
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
              className="w-full rounded-full border-white/70 bg-white/55 px-6 text-ink-800 backdrop-blur-xl backdrop-saturate-150 hover:bg-white/72 sm:w-auto dark:border-white/10 dark:bg-white/10 dark:text-ink-100 dark:hover:bg-white/20"
            >
              <Link href="/store">
                <Play className="h-4 w-4" />
                查看示例
              </Link>
            </Button>
          </div>

          {/* 信任徽章 - 极简灰 */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-ink-500 dark:text-ink-400">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-ink-950 dark:bg-ink-100" />
              永久免费档
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-ink-950 dark:bg-ink-100" />
              无需信用卡
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-ink-950 dark:bg-ink-100" />
              支持本地部署
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/** 装饰性浮动粒子 - 极简灰白 */
function Particles() {
  const particles = [
    { left: "10%", top: "20%", size: 6, delay: "0s" },
    { left: "25%", top: "60%", size: 4, delay: "2s" },
    { left: "45%", top: "30%", size: 8, delay: "4s" },
    { left: "65%", top: "70%", size: 5, delay: "1s" },
    { left: "80%", top: "25%", size: 7, delay: "3s" },
    { left: "92%", top: "55%", size: 4, delay: "5s" },
    { left: "15%", top: "85%", size: 6, delay: "2.5s" },
    { left: "55%", top: "15%", size: 5, delay: "4.5s" },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {particles.map((p, i) => (
        <span
          key={i}
          className="particle bg-ink-300/40 dark:bg-ink-400/30"
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
