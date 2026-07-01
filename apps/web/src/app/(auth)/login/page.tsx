"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Boxes, Loader2 } from "lucide-react";

import { LoginInputSchema, type LoginInput } from "@lynxkit/shared";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/lib/use-toast";
import { setToken } from "@/lib/api-client";
import { trpc } from "@/lib/trpc";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginInputSchema),
    defaultValues: { email: "", password: "" },
  });

  // 调用 tRPC auth.login
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      const res = data as { user: unknown; token: string };
      setToken(res.token);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "lynxkit_user",
          JSON.stringify(res.user)
        );
      }
      toast({ title: "登录成功", description: "欢迎回来！" });
      router.push("/console");
    },
    onError: (err) => {
      toast({
        title: "登录失败",
        description: err.message ?? "邮箱或密码错误",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: LoginInput) => {
    loginMutation.mutate(values);
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
        <h1 className="text-2xl font-bold text-zinc-900">欢迎回来</h1>
        <p className="mt-1 text-sm text-zinc-500">
          登录到 LynxKit，继续构建你的产品
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
            placeholder="••••••••"
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          登录
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        还没有账号？{" "}
        <Link
          href="/register"
          className="font-medium text-lynx-600 hover:text-lynx-700"
        >
          立即注册
        </Link>
      </p>
    </div>
  );
}
