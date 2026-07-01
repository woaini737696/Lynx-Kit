"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, User as UserIcon, KeyRound } from "lucide-react";

import { isValidPhone } from "@lynxkit/shared";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/lib/use-toast";
import { trpc } from "@/lib/trpc";

// 用户资料表单 schema
const profileSchema = z.object({
  name: z.string().min(1, "请输入姓名").max(50),
  avatar: z.string().url("请输入有效的图片 URL").optional().or(z.literal("")),
  phone: z
    .string()
    .optional()
    .refine((v) => !v || isValidPhone(v), "手机号格式不正确"),
});
type ProfileForm = z.infer<typeof profileSchema>;

// 修改密码表单 schema
const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, "请输入当前密码"),
    newPassword: z
      .string()
      .min(8, "密码至少 8 位")
      .refine(
        (v) => /[a-zA-Z]/.test(v) && /\d/.test(v),
        "密码需包含字母和数字"
      ),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });
type PasswordForm = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { toast } = useToast();

  // 用户资料表单
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", avatar: "", phone: "" },
  });

  // 修改密码表单
  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { oldPassword: "", newPassword: "", confirmPassword: "" },
  });

  const updateProfile = trpc.auth.me.useMutation({
    onSuccess: () =>
      toast({ title: "资料已保存", description: "用户信息已更新" }),
    onError: (e) =>
      toast({
        title: "保存失败",
        description: e.message,
        variant: "destructive",
      }),
  });

  const changePassword = trpc.auth.me.useMutation({
    onSuccess: () => {
      toast({ title: "密码已修改", description: "请用新密码重新登录" });
      passwordForm.reset();
    },
    onError: (e) =>
      toast({
        title: "修改失败",
        description: e.message,
        variant: "destructive",
      }),
  });

  const onProfileSubmit = (values: ProfileForm) => {
    updateProfile.mutate(values);
  };

  const onPasswordSubmit = (values: PasswordForm) => {
    changePassword.mutate({
      oldPassword: values.oldPassword,
      newPassword: values.newPassword,
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">设置</h1>
        <p className="mt-1 text-sm text-zinc-500">管理你的账户与安全设置</p>
      </div>

      {/* 用户资料表单 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-zinc-400" />
            用户资料
          </CardTitle>
          <CardDescription>更新你的个人信息</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={profileForm.handleSubmit(onProfileSubmit)}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">姓名</label>
              <Input
                placeholder="请输入姓名"
                {...profileForm.register("name")}
              />
              {profileForm.formState.errors.name && (
                <p className="text-xs text-red-500">
                  {profileForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">
                头像 URL
              </label>
              <Input
                placeholder="https://..."
                {...profileForm.register("avatar")}
              />
              {profileForm.formState.errors.avatar && (
                <p className="text-xs text-red-500">
                  {profileForm.formState.errors.avatar.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">手机号</label>
              <Input
                placeholder="13800000000"
                {...profileForm.register("phone")}
              />
              {profileForm.formState.errors.phone && (
                <p className="text-xs text-red-500">
                  {profileForm.formState.errors.phone.message}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                保存
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 修改密码表单 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-zinc-400" />
            修改密码
          </CardTitle>
          <CardDescription>定期更换密码以保障账户安全</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">
                当前密码
              </label>
              <Input
                type="password"
                autoComplete="current-password"
                {...passwordForm.register("oldPassword")}
              />
              {passwordForm.formState.errors.oldPassword && (
                <p className="text-xs text-red-500">
                  {passwordForm.formState.errors.oldPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">
                新密码
              </label>
              <Input
                type="password"
                placeholder="至少 8 位，含字母和数字"
                autoComplete="new-password"
                {...passwordForm.register("newPassword")}
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-xs text-red-500">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">
                确认新密码
              </label>
              <Input
                type="password"
                autoComplete="new-password"
                {...passwordForm.register("confirmPassword")}
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-xs text-red-500">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={changePassword.isPending}>
                {changePassword.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                修改密码
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
