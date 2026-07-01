import * as React from "react";

import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

/**
 * 修改密码表单
 */

export interface PasswordChangeProps {
  onSubmit?: (values: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<void> | void;
  loading?: boolean;
  /** 是否需要验证旧密码（创建账户首次设置密码时不需要） */
  requireCurrent?: boolean;
}

export function PasswordChange({
  onSubmit,
  loading,
  requireCurrent = true,
}: PasswordChangeProps) {
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [error, setError] = React.useState<string | undefined>();
  const [done, setDone] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setDone(false);
    if (requireCurrent && !current) {
      setError("请输入当前密码");
      return;
    }
    if (next.length < 8) {
      setError("新密码至少 8 位");
      return;
    }
    if (next !== confirm) {
      setError("两次输入的新密码不一致");
      return;
    }
    try {
      await onSubmit?.({ currentPassword: current, newPassword: next });
      setDone(true);
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "修改失败");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-4">
      {requireCurrent && (
        <Input
          type="password"
          label="当前密码"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          autoComplete="current-password"
          required
        />
      )}
      <Input
        type="password"
        label="新密码"
        value={next}
        onChange={(e) => setNext(e.target.value)}
        placeholder="至少 8 位"
        autoComplete="new-password"
        required
      />
      <Input
        type="password"
        label="确认新密码"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        autoComplete="new-password"
        required
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {done && <p className="text-sm text-green-600">密码已修改</p>}
      <Button type="submit" loading={loading} className="self-start">
        修改密码
      </Button>
    </form>
  );
}
