"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Boxes, Loader2 } from "lucide-react";

import { isStrongPassword } from "@lynxkit/shared";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/lib/use-toast";
import { setToken } from "@/lib/api-client";
import { trpc } from "@/lib/trpc";

// 注册表单 schema：邮箱 + 强密码 + 确认密码
const registerSchema = z
  .object({
    email: z.string().email("邮箱格式不正确"),
    password: z
      .string()
      .min(8, "密码至少 8 位")
      .refine(isStrongPassword, "密码需包含字母和数字"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  // 调用 tRPC auth.register
  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      const res = data as { user: unknown; token: string } | undefined;
      if (res?.token) {
        // 注册成功后自动登录
        setToken(res.token);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            "lynxkit_user",
            JSON.stringify(res.user)
          );
        }
        toast({ title: "注册成功", description: "已自动登录，欢迎加入！" });
        router.push("/console");
      } else {
        toast({ title: "注册成功", description: "请登录" });
        router.push("/login");
      }
    },
    onError: (err) => {
      toast({
        title: "注册失败",
        description: err.message ?? "该邮箱可能已被注册",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: RegisterForm) => {
    registerMutation.mutate({
      email: values.email,
      password: values.password,
    });
  };

  return (
    <div>
      <div className="mb-8 flex items-center gap-2 lg:hidden">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lynx-500 text-white">
          <Boxes className="h-5 w-5" />
        </span>
        <span className="text-lg font-bold">LynxKit</span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">创建账号</h1>
        <p className="mt-1 text-sm text-zinc-500">
          免费注册，开始构建你的第一个产品
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-zinc-700">
            邮箱
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="text-sm font-medium text-zinc-700"
          >
            密码
          </label>
          <Input
            id="password"
            type="password"
            placeholder="至少 8 位，含字母和数字"
            autoComplete="new-password"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-zinc-700"
          >
            确认密码
          </label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="再次输入密码"
            autoComplete="new-password"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-red-500">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          注册
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        已有账号？{" "}
        <Link
          href="/login"
          className="font-medium text-lynx-600 hover:text-lynx-700"
        >
          去登录
        </Link>
      </p>
    </div>
  );
}
