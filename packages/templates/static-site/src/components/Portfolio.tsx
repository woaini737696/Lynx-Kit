import { config } from "@/config";

/**
 * 作品集区块
 * 网格布局展示作品项目
 *
 * config.portfolioItems 为多行字符串（每行一项作品），由 AI 在填充 config 时转为数组
 */
interface PortfolioItem {
  title: string;
  description?: string;
}

function parsePortfolio(raw: string): PortfolioItem[] {
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

export function Portfolio() {
  const items = parsePortfolio(config.portfolioItems);

  return (
    <section id="portfolio" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            作品集
          </h2>
          <p className="mt-4 text-lg text-gray-600">精选过往项目</p>
        </div>
        {items.length === 0 ? (
          <p className="mt-12 text-center text-sm text-gray-400">
            暂未填写作品
          </p>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, idx) => (
              <div
                key={item.title + idx}
                className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md"
              >
                <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                  <span className="text-4xl text-gray-300">🎨</span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="mt-1 text-sm text-gray-600">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
