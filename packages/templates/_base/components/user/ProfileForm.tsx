import * as React from "react";

import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

/**
 * 资料编辑表单
 */

export interface ProfileFormValues {
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  bio?: string;
}

export interface ProfileFormProps {
  defaultValues?: Partial<ProfileFormValues>;
  onSubmit?: (values: ProfileFormValues) => Promise<void> | void;
  loading?: boolean;
}

export function ProfileForm({
  defaultValues,
  onSubmit,
  loading,
}: ProfileFormProps) {
  const [values, setValues] = React.useState<ProfileFormValues>({
    name: defaultValues?.name ?? "",
    email: defaultValues?.email ?? "",
    phone: defaultValues?.phone ?? "",
    avatar: defaultValues?.avatar,
    bio: defaultValues?.bio ?? "",
  });
  const [error, setError] = React.useState<string | undefined>();
  const [saved, setSaved] = React.useState(false);

  const update = <K extends keyof ProfileFormValues>(
    key: K,
    value: ProfileFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    if (!values.name.trim()) {
      setError("请输入昵称");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      setError("邮箱格式不正确");
      return;
    }
    try {
      await onSubmit?.(values);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-4">
      <Input
        label="昵称"
        value={values.name}
        onChange={(e) => update("name", e.target.value)}
        required
      />
      <Input
        type="email"
        label="邮箱"
        value={values.email}
        onChange={(e) => update("email", e.target.value)}
        required
      />
      <Input
        type="tel"
        label="手机号"
        value={values.phone ?? ""}
        onChange={(e) => update("phone", e.target.value)}
        placeholder="选填"
      />
      <Input
        label="头像 URL"
        value={values.avatar ?? ""}
        onChange={(e) => update("avatar", e.target.value)}
        placeholder="选填"
      />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">个人简介</label>
        <textarea
          value={values.bio}
          onChange={(e) => update("bio", e.target.value)}
          placeholder="简单介绍一下自己..."
          className="min-h-[80px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-600">资料已保存</p>}
      <Button type="submit" loading={loading} className="self-start">
        保存资料
      </Button>
    </form>
  );
}
