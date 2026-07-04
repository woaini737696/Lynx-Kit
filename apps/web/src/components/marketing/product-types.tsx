import {
  Heart,
  Server,
  Briefcase,
  BarChart3,
  LayoutDashboard,
  Smartphone,
  Megaphone,
  Cpu,
} from "lucide-react";
import { PRODUCT_TYPES } from "@lynxkit/shared";

const ICON_MAP: Record<string, React.ReactNode> = {
  heart: <Heart className="h-5 w-5" />,
  server: <Server className="h-5 w-5" />,
  briefcase: <Briefcase className="h-5 w-5" />,
  chart: <BarChart3 className="h-5 w-5" />,
  dashboard: <LayoutDashboard className="h-5 w-5" />,
  mobile: <Smartphone className="h-5 w-5" />,
  megaphone: <Megaphone className="h-5 w-5" />,
  cpu: <Cpu className="h-5 w-5" />,
};

export function ProductTypes() {
  return (
    <section
      id="product-types"
      className="relative border-y border-ink-200/60 bg-ink-50/30 py-24 sm:py-32 dark:border-ink-800/60 dark:bg-ink-950/30"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
            产品类型
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.02em] text-ink-950 sm:text-4xl md:text-5xl dark:text-ink-50">
            8 类产品类型
          </h2>
          <p className="mt-4 text-lg text-ink-500 dark:text-ink-400">
            覆盖绝大多数 AI 应用场景
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCT_TYPES.map((type) => (
            <article
              key={type.id}
              className="glow-card group p-5"
            >
              {/* 黑色方块图标 */}
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-950 text-white shadow-sm transition-transform group-hover:scale-105 dark:bg-ink-100 dark:text-ink-950">
                {ICON_MAP[type.icon] ?? <Cpu className="h-5 w-5" />}
              </div>
              <h3 className="mt-4 text-base font-semibold tracking-[-0.01em] text-ink-900 dark:text-ink-50">
                {type.name}
              </h3>
              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                {type.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {type.applicableScenes.slice(0, 2).map((scene) => (
                  <span
                    key={scene}
                    className="rounded-full bg-ink-100 px-2.5 py-0.5 text-xs text-ink-600 dark:bg-ink-800 dark:text-ink-300"
                  >
                    {scene}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
