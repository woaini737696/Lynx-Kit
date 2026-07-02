import Link from "next/link";
import { Check } from "lucide-react";
import { Button, Badge } from "@lynxkit/ui-web";
import { cn } from "@/lib/utils";

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  desc: string;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
}

const PLANS: PricingPlan[] = [
  {
    name: "免费版",
    price: "¥0",
    period: "永久免费",
    desc: "适合个人尝鲜与本地构建",
    features: [
      "每月 5 次构建",
      "本地优先 AI 推理",
      "基础 9 层 Agent 流水线",
      "社区支持",
    ],
    cta: "免费开始",
    href: "/register",
  },
  {
    name: "专业版",
    price: "¥99",
    period: "/ 月",
    desc: "适合独立开发者与小型团队",
    features: [
      "无限次构建",
      "云端 AI 模型（GPT-4 / Claude）",
      "商店发布权限",
      "自定义域名部署",
      "邮件支持",
    ],
    cta: "升级专业版",
    href: "/register?plan=pro",
    highlighted: true,
  },
  {
    name: "团队版",
    price: "¥399",
    period: "/ 月",
    desc: "适合成长期团队协作",
    features: [
      "10 个团队席位",
      "共享 AI 模型配额",
      "团队商店与权限管理",
      "SSO 单点登录",
      "专属客服支持",
    ],
    cta: "联系销售",
    href: "/contact?plan=team",
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-lynx-500">
            定价
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            简单透明的定价
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            从个人到团队，按需选择
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <article
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-2xl border p-6 transition-all",
                plan.highlighted
                  ? "border-lynx-500 shadow-xl shadow-lynx-500/10 md:-translate-y-2"
                  : "border-border hover:border-lynx-500/50",
              )}
            >
              {plan.highlighted ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-lynx-500 text-white">最受欢迎</Badge>
                </div>
              ) : null}

              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.desc}</p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight">
                  {plan.price}
                </span>
                <span className="text-sm text-muted-foreground">
                  {plan.period}
                </span>
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-lynx-500" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className={cn(
                  "mt-6 w-full",
                  plan.highlighted
                    ? "bg-lynx-500 text-white hover:bg-lynx-600"
                    : "",
                )}
                variant={plan.highlighted ? "default" : "outline"}
              >
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
