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
  // 非受控模式：父组件未传 active 时，内部 state 管理选中态
  const [internalActive, setInternalActive] = React.useState("all");
  const active = activeProp ?? internalActive;
  const handleChange = (slug: string) => {
    setInternalActive(slug);
    onChange?.(slug);
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        className,
      )}
      role="tablist"
    >
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
