import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { Button } from "@lynxkit/ui-web";

export function CTA() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      {/* 渐变背景 */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-lynx-500 via-lynx-600 to-lynx-700"
      />
      {/* 装饰圆 */}
      <div
        aria-hidden
        className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-black/10 blur-3xl"
      />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center text-white">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            准备好开始造物了吗？
          </h2>
          <p className="mt-4 text-lg text-white/80 sm:text-xl">
            立即创建你的第一个 AI 产品，从一句话到上线只需几分钟
          </p>

          <div className="mt-10 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              asChild
              size="lg"
              className="w-full bg-white text-lynx-600 shadow-lg hover:bg-white/90 sm:w-auto"
            >
              <Link href="/register">
                免费开始
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white sm:w-auto"
            >
              <Link href="/contact">
                <Mail className="h-4 w-4" />
                联系销售
              </Link>
            </Button>
          </div>

          <p className="mt-6 text-xs text-white/70">
            永久免费档 · 无需信用卡 · 随时取消
          </p>
        </div>
      </div>
    </section>
  );
}
