import { config } from "@/config";

import { Card } from "@/_base/components/ui/Card";

/**
 * 服务介绍区块
 * 3 列卡片展示
 *
 * config.services 为多行字符串（每行一项服务），由 AI 在填充 config 时转为数组
 */
const serviceIcons = ["✦", "✧", "✑", "✱", "✲", "✳"];

interface ServiceItem {
  title: string;
  description?: string;
}

function parseServices(raw: string): ServiceItem[] {
  if (!raw) return [];
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, description] = line.split(/[—\-—–]/).map((s) => s.trim());
      return { title: title || line, description };
    });
}

export function Services() {
  const services = parseServices(config.services);

  return (
    <section
      id="services"
      className="bg-gray-50 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            服务介绍
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            提供以下专业服务，欢迎咨询
          </p>
        </div>
        {services.length === 0 ? (
          <p className="mt-12 text-center text-sm text-gray-400">
            暂未填写服务内容
          </p>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, idx) => (
              <Card key={service.title} hover>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-lg text-blue-600">
                  {serviceIcons[idx % serviceIcons.length]}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {service.title}
                </h3>
                {service.description && (
                  <p className="mt-2 text-sm text-gray-600">
                    {service.description}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
