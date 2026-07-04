"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface Category {
  slug: string;
  name: string;
  count?: number;
}

interface CategoryFilterProps {
  categories: Category[];
  active?: string;
  onChange?: (slug: string) => void;
  className?: string;
}

export function CategoryFilter({
  categories,
  active: activeProp,
  onChange,
  className,
}: CategoryFilterProps) {
  const [internalActive, setInternalActive] = React.useState("all");
  const active = activeProp ?? internalActive;
  const handleChange = (slug: string) => {
    setInternalActive(slug);
    onChange?.(slug);
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)} role="tablist">
      {categories.map((c) => {
        const isActive = active === c.slug;
        return (
          <button
            key={c.slug}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => handleChange(c.slug)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all",
              isActive
                ? "border-ink-950 bg-ink-950 text-white shadow-sm dark:border-ink-100 dark:bg-ink-100 dark:text-ink-950"
                : "border-white/70 bg-white/55 text-ink-600 backdrop-blur-xl backdrop-saturate-150 hover:bg-white/72 hover:text-ink-950 dark:border-white/10 dark:bg-white/10 dark:text-ink-300 dark:hover:bg-white/20 dark:hover:text-ink-50",
            )}
          >
            {c.name}
            {typeof c.count === "number" ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px]",
                  isActive
                    ? "bg-white/20 dark:bg-ink-950/20"
                    : "bg-ink-100 dark:bg-ink-800",
                )}
              >
                {c.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
