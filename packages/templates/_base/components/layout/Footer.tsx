import * as React from "react";

/**
 * 页脚
 * - 社交链接占位
 * - 备案信息占位
 */

export interface FooterProps {
  brandName?: string;
  socialLinks?: { label: string; href: string }[];
  icp?: string;
  copyright?: string;
}

const defaultSocial = [
  { label: "GitHub", href: "#" },
  { label: "Twitter", href: "#" },
  { label: "Email", href: "#" },
];

export function Footer({
  brandName = "{{serviceName}}",
  socialLinks = defaultSocial,
  icp = "{{icpNumber}}",
  copyright,
}: FooterProps) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-6 sm:flex-row sm:justify-between sm:px-6">
        <div className="text-sm text-gray-500">
          © {copyright ?? `${year} ${brandName}. All rights reserved.`}
        </div>
        <div className="flex items-center gap-4 text-sm">
          {socialLinks.map((s) => (
            <a
              key={s.label}
              href={s.href}
              className="text-gray-500 hover:text-gray-900"
            >
              {s.label}
            </a>
          ))}
        </div>
        {icp && (
          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            {icp}
          </a>
        )}
      </div>
    </footer>
  );
}
