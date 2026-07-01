import * as React from "react";

import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

/**
 * 注册表单组件
 * 占位实现：业务方接入实际认证逻辑后替换 onSubmit
 */

export interface RegisterFormProps {
  onSubmit?: (values: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void> | void;
  onLogin?: () => void;
  loading?: boolean;
}

export function RegisterForm({ onSubmit, onLogin, loading }: RegisterFormProps) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "请输入昵称";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "邮箱格式不正确";
    if (password.length < 8) next.password = "密码至少 8 位";
    if (confirm !== password) next.confirm = "两次输入的密码不一致";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await onSubmit?.({ name, email, password });
    } catch (err) {
      setErrors({
        confirm: err instanceof Error ? err.message : "注册失败，请重试",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <h1 className="text-xl font-semibold text-gray-900">注册账号</h1>
      <Input
        label="昵称"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="你的名字"
        error={errors.name}
        autoComplete="name"
        required
      />
      <Input
        type="email"
        label="邮箱"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        error={errors.email}
        autoComplete="email"
        required
      />
      <Input
        type="password"
        label="密码"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="至少 8 位"
        error={errors.password}
        autoComplete="new-password"
        required
      />
      <Input
        type="password"
        label="确认密码"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="再次输入密码"
        error={errors.confirm}
        autoComplete="new-password"
        required
      />
      <Button type="submit" fullWidth loading={loading}>
        注册
      </Button>
      <div className="text-center text-sm">
        已有账号？{" "}
        <button
          type="button"
          onClick={onLogin}
          className="text-blue-600 hover:underline"
        >
          前往登录
        </button>
      </div>
    </form>
  );
}
