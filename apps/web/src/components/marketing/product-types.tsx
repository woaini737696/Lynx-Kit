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

/**
 * 8 类产品类型展示
 *
 * 与 @lynxkit/shared 的 PRODUCT_TYPES 常量保持对齐，
 * 图标使用 lucide-react 渲染。
 */
const ICON_MAP: Record<string, React.ReactNode> = {
  heart: <Heart className="h-6 w-6" />,
  server: <Server className="h-6 w-6" />,
  briefcase: <Briefcase className="h-6 w-6" />,
  chart: <BarChart3 className="h-6 w-6" />,
  dashboard: <LayoutDashboard className="h-6 w-6" />,
  mobile: <Smartphone className="h-6 w-6" />,
  megaphone: <Megaphone className="h-6 w-6" />,
  cpu: <Cpu className="h-6 w-6" />,
};

export function ProductTypes() {
  return (
    <section
      id="product-types"
      className="relative border-y border-border bg-muted/30 py-24 sm:py-32"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-lynx-500">
            产品类型
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            8 类产品类型
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            覆盖绝大多数 AI 应用场景
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCT_TYPES.map((type) => (
            <article
              key={type.id}
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `${type.color}1a`,
                  color: type.color,
                }}
              >
                {ICON_MAP[type.icon] ?? <Cpu className="h-6 w-6" />}
              </div>
              <h3 className="mt-4 text-base font-semibold">{type.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {type.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {type.applicableScenes.slice(0, 2).map((scene) => (
                  <span
                    key={scene}
                    className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {scene}
                  </span>
                ))}
              </div>
              {/* 装饰条 */}
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                style={{ backgroundColor: type.color }}
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
