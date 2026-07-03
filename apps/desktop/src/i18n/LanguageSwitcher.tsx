/**
 * 语言切换器
 *
 * 在 title-bar 右上角显示当前语言代码，点击切换 zh / en。
 * 切换后通过 i18next 自动持久化到 localStorage（lynxkit:lang）。
 */

import * as React from "react";
import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS, type Language } from "@/i18n";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  const current = (i18n.resolvedLanguage ?? "zh") as Language;
  const isSupported = SUPPORTED_LANGUAGES.includes(current);
  const display = isSupported ? LANGUAGE_LABELS[current] : current;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Language"
        title={display}
        className={cn(
          "flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition",
          "hover:bg-accent hover:text-foreground",
        )}
      >
        <Globe className="h-3.5 w-3.5" />
        <span className="hidden md:inline">{current.toUpperCase()}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[120px] overflow-hidden rounded-md border border-border bg-popover py-1 shadow-md">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => {
                void i18n.changeLanguage(lang);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between px-3 py-1.5 text-left text-xs transition",
                lang === current
                  ? "bg-lynx-500/10 text-lynx-600 dark:text-lynx-400"
                  : "text-foreground hover:bg-accent",
              )}
            >
              <span>{LANGUAGE_LABELS[lang]}</span>
              <span className="text-[10px] text-muted-foreground">
                {lang.toUpperCase()}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
