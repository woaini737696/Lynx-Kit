"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Mail, Crown } from "lucide-react";
import { Button } from "@lynxkit/ui-web";
import { useAuthStore } from "@lynxkit/store";

/**
 * 营销首页底部 CTA · iOS26 极简黑白灰
 *
 * - 主 CTA：根据登录态切换
 *   - 未登录 → "免费开始" 跳 /register
 *   - 已登录 → "前往会员中心" 跳 /membership
 * - 次 CTA：联系销售（不变）
 */
export function CTA() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <section className="relative overflow-hidden bg-ink-950 py-24 dark:bg-ink-900 sm:py-32">
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center text-white">
          <h2 className="text-3xl font-bold tracking-[-0.03em] sm:text-4xl md:text-5xl">
            准备好开始造物了吗？
          </h2>
          <p className="mt-4 text-lg text-white/70 sm:text-xl">
            立即创建你的第一个 AI 产品，从一句话到上线只需几分钟
          </p>

          <div className="mt-10 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {/* 主按钮 - 白底黑字，按登录态切换 */}
            <Button
              asChild
              size="lg"
              className="w-full rounded-full bg-white px-6 text-ink-950 shadow-lg hover:bg-white/90 hover:translate-y-[-1px] sm:w-auto"
            >
              {isAuthenticated ? (
                <Link href="/membership">
                  <Crown className="h-4 w-4" />
                  前往会员中心
                </Link>
              ) : (
                <Link href="/register">
                  免费开始
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </Button>
            {/* 次按钮 - 透明边框 - mailto 邮箱链接 */}
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full rounded-full border-white/30 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white sm:w-auto"
            >
              <a href="mailto:hello@lynxkit.com?subject=销售咨询">
                <Mail className="h-4 w-4" />
                联系销售
              </a>
            </Button>
          </div>

          <p className="mt-6 text-xs text-white/50">
            永久免费档 · 无需信用卡 · 随时取消
          </p>
        </div>
      </div>
    </section>
  );
}
