import { config } from "@/config";

/**
 * 页脚
 * 包含品牌信息 + 联系方式占位
 */
export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-sm text-gray-600">
            © {year} {config.serviceName}. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {config.contact.email && (
              <a
                href={`mailto:${config.contact.email}`}
                className="hover:text-gray-900"
              >
                {config.contact.email}
              </a>
            )}
            {config.contact.phone && (
              <a
                href={`tel:${config.contact.phone}`}
                className="hover:text-gray-900"
              >
                {config.contact.phone}
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
