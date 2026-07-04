import { Star } from "lucide-react";

interface Testimonial {
  name: string;
  role: string;
  avatar: string;
  rating: number;
  content: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "陈思远",
    role: "独立开发者",
    avatar: "陈",
    rating: 5,
    content:
      "妙想让我用一句话就生成了一个完整的电商后台，从数据库到 UI 全自动。过去两周的工作量现在只要一下午。",
  },
  {
    name: "Linda Wang",
    role: "AI 产品经理",
    avatar: "L",
    rating: 5,
    content:
      "9 层 Agent 流水线的设计太精妙了，每一步都能看到决策过程，不像其他工具黑盒生成。审核代码反而成了享受。",
  },
  {
    name: "张明",
    role: "SaaS 创业者",
    avatar: "张",
    rating: 5,
    content:
      "上线一周内就发布了 3 个 AI 应用到商店，第一个已经开始有付费用户了。妙想真的让超级个体成为可能。",
  },
];

export function Testimonials() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
            用户评价
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.02em] text-ink-950 sm:text-4xl md:text-5xl dark:text-ink-50">
            看看超级个体们怎么说
          </h2>
          <p className="mt-4 text-lg text-ink-500 dark:text-ink-400">
            来自全球独立开发者与创业者的真实反馈
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <article key={t.name} className="glow-card p-6">
              {/* 评分 - 黑色星星 */}
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={
                      i < t.rating
                        ? "h-4 w-4 fill-ink-950 text-ink-950 dark:fill-ink-100 dark:text-ink-100"
                        : "h-4 w-4 text-ink-300 dark:text-ink-700"
                    }
                  />
                ))}
              </div>

              {/* 内容 */}
              <p className="mt-4 text-sm leading-relaxed text-ink-700 dark:text-ink-200">
                &ldquo;{t.content}&rdquo;
              </p>

              {/* 作者 - 黑色圆形头像 */}
              <div className="mt-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-950 text-sm font-semibold text-white dark:bg-ink-100 dark:text-ink-950">
                  {t.avatar}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink-900 dark:text-ink-50">{t.name}</p>
                  <p className="text-xs text-ink-500 dark:text-ink-400">{t.role}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
