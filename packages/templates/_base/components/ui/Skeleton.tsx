import * as React from "react";

/**
 * 加载骨架屏组件
 * 用于数据未加载时的占位
 */

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "rect" | "circle";
  width?: React.CSSProperties["width"];
  height?: React.CSSProperties["height"];
  count?: number;
}

export function Skeleton({
  variant = "rect",
  width,
  height,
  count = 1,
  className = "",
  style,
  ...rest
}: SkeletonProps) {
  const variantClasses = {
    text: "rounded",
    rect: "rounded-md",
    circle: "rounded-full",
  } as const;

  const baseStyle: React.CSSProperties = {
    width: width ?? (variant === "text" ? "100%" : undefined),
    height: height ?? (variant === "text" ? "1em" : variant === "circle" ? "2.5rem" : undefined),
    ...style,
  };

  if (count <= 1) {
    return (
      <div
        aria-hidden="true"
        className={[
          "animate-pulse bg-gray-200",
          variantClasses[variant],
          className,
        ].join(" ")}
        style={baseStyle}
        {...rest}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={[
            "animate-pulse bg-gray-200",
            variantClasses[variant],
            className,
          ].join(" ")}
          style={baseStyle}
        />
      ))}
    </div>
  );
}
