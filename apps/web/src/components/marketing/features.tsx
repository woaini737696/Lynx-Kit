import { Brain, Cpu, Rocket } from "lucide-react";

interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  desc: string;
  highlights: string[];
}

const FEATURES: FeatureItem[] = [
  {
    icon: <Brain className="h-5 w-5" />,
    title: "意图识别",
    desc: "AI 解析你的描述，匹配最适合的产品类型与技术栈",
    highlights: ["NLP 意图解析", "8 类产品匹配", "技术栈预选"],
  },
  {
    icon: <Cpu className="h-5 w-5" />,
    title: "架构生成",
    desc: "10 层 Agent 协同设计数据库、API、UI 与部署方案",
    highlights: ["9 层 Agent 流水线", "代码可审可改", "实时预览产物"],
  },
  {
    icon: <Rocket className="h-5 w-5" />,
    title: "一键部署",
    desc: "Docker + Caddy 自动部署到云端，分钟级上线",
    highlights: ["容器化部署", "自动 HTTPS", "回滚一键搞定"],
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* 标题 */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
            核心能力
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.02em] text-ink-950 sm:text-4xl md:text-5xl dark:text-ink-50">
            三大核心能力
          </h2>
          <p className="mt-4 text-lg text-ink-500 dark:text-ink-400">
            从意图识别到自动部署，全流程 AI 协作
          </p>
        </div>

        {/* 卡片 - 毛玻璃 */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <article
              key={feature.title}
              className="glow-card group p-6"
            >
              {/* 黑色方块图标 */}
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-950 text-white shadow-sm transition-transform group-hover:scale-105 dark:bg-ink-100 dark:text-ink-950">
                {feature.icon}
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-[-0.01em] text-ink-900 dark:text-ink-50">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
                {feature.desc}
              </p>
              <ul className="mt-4 space-y-2">
                {feature.highlights.map((h) => (
                  <li
                    key={h}
                    className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300"
                  >
                    <span className="h-1 w-1 rounded-full bg-ink-950 dark:bg-ink-100" />
                    {h}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
