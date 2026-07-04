"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@lynxkit/ui-web";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  className?: string;
}

export function SearchBar({
  value,
  defaultValue,
  placeholder = "搜索应用…",
  onChange,
  onSubmit,
  className,
}: SearchBarProps) {
  const [internal, setInternal] = React.useState(defaultValue ?? "");
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(current);
  };

  const handleClear = () => {
    if (!isControlled) setInternal("");
    onChange?.("");
  };

  return (
    <form onSubmit={handleSubmit} className={cn("relative w-full", className)} role="search">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
      <Input
        type="search"
        value={current}
        onChange={handleChange}
        placeholder={placeholder}
        className="h-12 rounded-full border-white/70 bg-white/55 pl-11 pr-11 text-base backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/10"
      />
      {current ? (
        <button
          type="button"
          onClick={handleClear}
          aria-label="清除搜索"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 transition-colors hover:text-ink-950 dark:hover:text-ink-50"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </form>
  );
}
