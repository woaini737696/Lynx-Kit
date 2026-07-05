"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Crown } from "lucide-react";
import { Button, Badge } from "@lynxkit/ui-web";
import { useAuthStore } from "@lynxkit/store";
import { cn } from "@/lib/utils";

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  desc: string;
  features: string[];
  cta: string;
  /** 未登录时的目标 */
  href: string;
  /** 已登录时的目标 */
  authedHref: string;
  /** 已登录时的 CTA 文案 */
  authedCta: string;
  highlighted?: boolean;
}

const PLANS: PricingPlan[] = [
  {
    name: "免费版",
    price: "¥0",
    period: "永久免费",
    desc: "适合个人尝鲜与本地构建",
    features: ["每月 5 次构建", "本地优先 AI 推理", "基础 9 层 Agent 流水线", "社区支持"],
    cta: "免费开始",
    href: "/register",
    authedHref: "/membership",
    authedCta: "前往会员中心",
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
    authedHref: "/membership?upgrade=PRO",
    authedCta: "升级专业版",
    highlighted: true,
  },
  {
    name: "团队版",
    price: "¥399",
    period: "/ 月",
    desc: "适合成长期团队协作",
    features: ["10 个团队席位", "共享 AI 模型配额", "团队商店与权限管理", "SSO 单点登录", "专属客服支持"],
    cta: "联系销售",
    href: "mailto:hello@lynxkit.com?subject=团队版咨询",
    authedHref: "mailto:hello@lynxkit.com?subject=团队版咨询",
    authedCta: "联系销售",
  },
];

export function Pricing() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <section id="pricing" className="relative py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
            定价
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.02em] text-ink-950 sm:text-4xl md:text-5xl dark:text-ink-50">
            简单透明的定价
          </h2>
          <p className="mt-4 text-lg text-ink-500 dark:text-ink-400">
            从个人到团队，按需选择
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {PLANS.map((plan) => {
            const targetHref = isAuthenticated ? plan.authedHref : plan.href;
            const targetLabel = isAuthenticated ? plan.authedCta : plan.cta;
            const showCrown = isAuthenticated && plan.name === "免费版";
            return (
              <article
                key={plan.name}
                className={cn(
                  "relative flex flex-col rounded-2xl p-6 transition-all duration-300",
                  plan.highlighted
                    ? "border-2 border-ink-950 bg-white shadow-[0_8px_32px_rgba(15,23,42,0.08)] dark:border-ink-100 dark:bg-ink-900"
                    : "glow-card hover:-translate-y-1",
                )}
              >
                {plan.highlighted ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="rounded-full bg-ink-950 px-3 py-1 text-xs font-medium text-white dark:bg-ink-100 dark:text-ink-950">
                      最受欢迎
                    </Badge>
                  </div>
                ) : null}

                <h3 className="text-lg font-semibold tracking-[-0.01em] text-ink-900 dark:text-ink-50">
                  {plan.name}
                </h3>
                <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{plan.desc}</p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-[-0.03em] text-ink-950 dark:text-ink-50">
                    {plan.price}
                  </span>
                  <span className="text-sm text-ink-500 dark:text-ink-400">{plan.period}</span>
                </div>

                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-ink-950 dark:text-ink-100" />
                      <span className="text-ink-600 dark:text-ink-300">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className={cn(
                    "mt-6 w-full rounded-full",
                    plan.highlighted
                      ? "bg-ink-950 text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)] hover:bg-ink-800 dark:bg-ink-100 dark:text-ink-950 dark:hover:bg-ink-200"
                      : "border border-ink-200 bg-white text-ink-900 hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50 dark:hover:bg-ink-800",
                  )}
                  variant={plan.highlighted ? "default" : "outline"}
                >
                  <Link href={targetHref}>
                    {showCrown ? <Crown className="h-4 w-4" /> : null}
                    {targetLabel}
                  </Link>
                </Button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
