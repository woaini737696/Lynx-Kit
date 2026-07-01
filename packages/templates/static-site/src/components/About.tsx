import { config } from "@/config";

import { Card } from "@/_base/components/ui/Card";

/**
 * 关于区块
 */
export function About() {
  return (
    <section id="about" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            关于
          </h2>
          <p className="mt-4 text-lg text-gray-600">{config.about.text}</p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Card>
            <div className="text-3xl font-bold text-blue-600">10+</div>
            <div className="mt-2 text-sm text-gray-500">年经验</div>
          </Card>
          <Card>
            <div className="text-3xl font-bold text-blue-600">50+</div>
            <div className="mt-2 text-sm text-gray-500">完成项目</div>
          </Card>
          <Card>
            <div className="text-3xl font-bold text-blue-600">100%</div>
            <div className="mt-2 text-sm text-gray-500">客户满意度</div>
          </Card>
        </div>
      </div>
    </section>
  );
}
