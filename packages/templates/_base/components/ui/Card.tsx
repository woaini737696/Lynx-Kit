import * as React from "react";

/**
 * 通用 Card 组件
 */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padded?: boolean;
}

export function Card({
  hover = false,
  padded = true,
  className = "",
  children,
  ...rest
}: CardProps) {
  const classes = [
    "rounded-lg border border-gray-200 bg-white",
    hover ? "transition-shadow hover:shadow-md" : "",
    padded ? "p-5" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={["text-sm text-gray-700", className].join(" ")}>{children}</div>;
}

export function CardFooter({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "mt-4 flex items-center justify-end gap-2 border-t border-gray-100 pt-3",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
