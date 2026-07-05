/**
 * 认证表单共享字段组件
 *
 * 从原 routes/auth/login.tsx 与 register.tsx 提取，避免重复实现（DEVELOPMENT.md §8.2）。
 * 仅用于 auth-modal 内的 login-form / register-form。
 */
import * as React from "react";
import { Phone } from "lucide-react";
import { Input, Label, cn } from "@lynxkit/ui-web";

export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-medium text-ink-600">
        {label}
      </Label>
      {children}
    </div>
  );
}

/** 带前缀图标的玻璃输入框 */
export function IconInput({
  icon,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400">
        {icon}
      </span>
      <Input
        {...props}
        className={cn(
          "input-glass h-[44px] w-full pl-10 text-sm text-ink-900",
          className,
        )}
      />
    </div>
  );
}

/** 手机号输入框（+86 前缀） */
export function PhoneInput({
  id,
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="input-glass flex h-[44px] items-center gap-2">
      <span className="flex items-center gap-1.5 border-r border-ink-300/70 pl-3.5 pr-2.5 text-sm font-medium text-ink-700">
        <Phone className="h-3.5 w-3.5 text-ink-400" />
        +86
      </span>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 11))}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="tel"
        className="h-full w-full bg-transparent pr-3.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
      />
    </div>
  );
}
