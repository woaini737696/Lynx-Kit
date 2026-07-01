import * as React from "react";

import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

/**
 * 登录表单组件
 * 占位实现：业务方接入实际认证逻辑后替换 onSubmit
 */

export interface LoginFormProps {
  onSubmit?: (values: { email: string; password: string }) => Promise<void> | void;
  onForgotPassword?: () => void;
  onRegister?: () => void;
  defaultEmail?: string;
  loading?: boolean;
}

export function LoginForm({
  onSubmit,
  onForgotPassword,
  onRegister,
  defaultEmail,
  loading,
}: LoginFormProps) {
  const [email, setEmail] = React.useState(defaultEmail ?? "");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | undefined>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    if (!email || !password) {
      setError("请输入邮箱和密码");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("邮箱格式不正确");
      return;
    }
    try {
      await onSubmit?.({ email, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败，请重试");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <h1 className="text-xl font-semibold text-gray-900">登录</h1>
      <Input
        type="email"
        label="邮箱"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
        required
      />
      <Input
        type="password"
        label="密码"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        autoComplete="current-password"
        required
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" fullWidth loading={loading}>
        登录
      </Button>
      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-blue-600 hover:underline"
        >
          忘记密码？
        </button>
        <button
          type="button"
          onClick={onRegister}
          className="text-blue-600 hover:underline"
        >
          注册新账号
        </button>
      </div>
    </form>
  );
}
