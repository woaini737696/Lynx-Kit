import { config } from "@/config";

import { Button } from "@/_base/components/ui/Button";

/**
 * Hero 区块
 * 大标题 + 副标题 + 主 CTA + 次 CTA
 */
export function Hero() {
  const scrollToContact = () => {
    document
      .getElementById("contact")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToPortfolio = () => {
    document
      .getElementById("portfolio")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-24 text-center sm:px-6 sm:py-32">
        <span
          className="mb-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
          style={{
            backgroundColor: "var(--color-primary)",
            color: "#fff",
            opacity: 0.9,
          }}
        >
          {config.serviceName}
        </span>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
          {config.heroTitle}
        </h1>
        {config.heroSubtitle && (
          <p className="mt-6 max-w-2xl text-base text-gray-600 sm:text-lg md:text-xl">
            {config.heroSubtitle}
          </p>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" onClick={scrollToContact}>
            联系我们
          </Button>
          <Button size="lg" variant="outline" onClick={scrollToPortfolio}>
            查看作品
          </Button>
        </div>
      </div>
    </section>
  );
}
