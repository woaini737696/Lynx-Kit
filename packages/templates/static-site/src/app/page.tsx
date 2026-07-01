import { config } from "@/config";

import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Services } from "@/components/Services";
import { Portfolio } from "@/components/Portfolio";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { Header } from "@/_base/components/layout/Header";

/**
 * 首页
 * - Hero 区块（大标题 + 副标题 + CTA）
 * - About 区块（关于我）
 * - Services 区块（服务介绍，3 列卡片）
 * - Portfolio 区块（作品集网格）
 * - Contact 区块（联系方式 + 表单）
 * - Footer
 */
export default function HomePage() {
  const nav = [
    { key: "about", label: "关于" },
    { key: "services", label: "服务" },
    { key: "portfolio", label: "作品" },
    { key: "contact", label: "联系" },
  ];

  return (
    <div>
      <Header brand={config.serviceName} nav={nav} />
      <main>
        <Hero />
        <About />
        <Services />
        <Portfolio />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
