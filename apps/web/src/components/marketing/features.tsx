import { Brain, Cpu, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  desc: string;
  highlights: string[];
  accent: string;
}

const FEATURES: FeatureItem[] = [
  {
    icon: <Brain className="h-6 w-6" />,
    title: "意图识别",
    desc: "AI 解析你的描述，匹配最适合的产品类型与技术栈",
    highlights: ["NLP 意图解析", "8 类产品匹配", "技术栈预选"],
    accent: "from-lynx-500/20 to-lynx-500/0 text-lynx-500",
  },
  {
    icon: <Cpu className="h-6 w-6" />,
    title: "架构生成",
    desc: "10 层 Agent 协同设计数据库、API、UI 与部署方案",
    highlights: ["9 层 Agent 流水线", "代码可审可改", "实时预览产物"],
    accent: "from-violet-500/20 to-violet-500/0 text-violet-500",
  },
  {
    icon: <Rocket className="h-6 w-6" />,
    title: "一键部署",
    desc: "Docker + Caddy 自动部署到云端，分钟级上线",
    highlights: ["容器化部署", "自动 HTTPS", "回滚一键搞定"],
    accent: "from-emerald-500/20 to-emerald-500/0 text-emerald-500",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* 标题 */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-lynx-500">
            核心能力
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            三大核心能力
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            从意图识别到自动部署，全流程 AI 协作
          </p>
        </div>

        {/* 卡片 */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <article
              key={feature.title}
              className="glow-card group p-6"
            >
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br",
                  feature.accent,
                )}
              >
                {feature.icon}
              </div>
              <h3 className="mt-5 text-xl font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {feature.desc}
              </p>
              <ul className="mt-4 space-y-2">
                {feature.highlights.map((h) => (
                  <li
                    key={h}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-lynx-500" />
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
