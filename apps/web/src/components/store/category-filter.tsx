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
  active,
  onChange,
  className,
}: CategoryFilterProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        className,
      )}
      role="tablist"
    >
      {categories.map((c) => {
        const isActive = (active ?? "all") === c.slug;
        return (
          <button
            key={c.slug}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange?.(c.slug)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "border-lynx-500 bg-lynx-500 text-white"
                : "border-border bg-background text-muted-foreground hover:border-lynx-500/40 hover:text-foreground",
            )}
          >
            {c.name}
            {typeof c.count === "number" ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px]",
                  isActive ? "bg-white/20" : "bg-muted",
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
