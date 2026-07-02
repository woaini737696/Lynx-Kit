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
    <form
      onSubmit={handleSubmit}
      className={cn("relative w-full", className)}
      role="search"
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={current}
        onChange={handleChange}
        placeholder={placeholder}
        className="h-11 pl-10 pr-10"
      />
      {current ? (
        <button
          type="button"
          onClick={handleClear}
          aria-label="清除搜索"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </form>
  );
}
