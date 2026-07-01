import * as React from "react";

import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

/**
 * 找回密码组件
 * 占位实现：通过邮箱发送重置链接
 */

export interface ForgotPasswordProps {
  onSubmit?: (email: string) => Promise<void> | void;
  onBack?: () => void;
  loading?: boolean;
}

export function ForgotPassword({ onSubmit, onBack, loading }: ForgotPasswordProps) {
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | undefined>();
  const [sent, setSent] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("邮箱格式不正确");
      return;
    }
    try {
      await onSubmit?.(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "发送失败，请重试");
    }
  };

  if (sent) {
    return (
      <div className="flex w-full max-w-sm flex-col gap-3 text-center">
        <h1 className="text-xl font-semibold text-gray-900">邮件已发送</h1>
        <p className="text-sm text-gray-500">
          重置链接已发送到 <strong>{email}</strong>，请在 30 分钟内查收。
        </p>
        <Button variant="ghost" onClick={onBack} fullWidth>
          返回登录
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <h1 className="text-xl font-semibold text-gray-900">找回密码</h1>
      <p className="text-sm text-gray-500">
        输入注册邮箱，我们会向你发送重置密码的链接。
      </p>
      <Input
        type="email"
        label="邮箱"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        error={error}
        autoComplete="email"
        required
      />
      <Button type="submit" fullWidth loading={loading}>
        发送重置链接
      </Button>
      <button
        type="button"
        onClick={onBack}
        className="text-center text-sm text-blue-600 hover:underline"
      >
        返回登录
      </button>
    </form>
  );
}
