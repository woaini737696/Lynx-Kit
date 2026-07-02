"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, Lock, ArrowRight } from "lucide-react";
import { Button, Input, Label, Separator } from "@lynxkit/ui-web";
import { toast } from "@lynxkit/ui-web";
import { useAuthStore } from "@lynxkit/store";
import { authApi } from "@/lib/api";

type Mode = "email" | "phone";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [mode, setMode] = React.useState<Mode>("email");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "email") {
        const res = await authApi.login(email, password);
        login(res.token, res.user);
        toast({ title: "登录成功", description: `欢迎回来，${res.user.name ?? "创作者"}` });
      } else {
        // 手机号 + 验证码（此处仅占位，等 StoreApi 暴露 sendCode 后接入）
        toast({
          title: "暂未开放",
          description: "手机号登录将在后续版本支持",
          variant: "destructive",
        });
        return;
      }
      // 登录成功跳转到桌面端下载页（或构建器）
      router.push("/download");
    } catch (err) {
      toast({
        title: "登录失败",
        description: err instanceof Error ? err.message : "请检查邮箱与密码",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* 标题 */}
      <div className="lg:hidden mb-8 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-lynx-500 to-lynx-600">
          <Sparkles className="h-4 w-4 text-white" />
        </span>
        <span className="text-lg font-bold tracking-tight">LynxKit</span>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">登录到 LynxKit</h1>
      <p className="mt-1 text-sm text-muted-foreground">继续你的造物之旅</p>

      {/* Tab 切换 */}
      <div className="mt-6 inline-flex rounded-lg border border-border bg-muted p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode("email")}
          className={
            mode === "email"
              ? "rounded-md bg-background px-3 py-1.5 font-medium shadow-sm"
              : "px-3 py-1.5 text-muted-foreground"
          }
        >
          邮箱
        </button>
        <button
          type="button"
          onClick={() => setMode("phone")}
          className={
            mode === "phone"
              ? "rounded-md bg-background px-3 py-1.5 font-medium shadow-sm"
              : "px-3 py-1.5 text-muted-foreground"
          }
        >
          手机号
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === "email" ? (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="email">邮箱</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">密码</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-lynx-600 hover:text-lynx-500 dark:text-lynx-400"
                >
                  忘记密码？
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="pl-10"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="phone">手机号</Label>
              <Input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入手机号"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="code">验证码</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  type="text"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="6 位验证码"
                />
                <Button type="button" variant="outline">
                  发送验证码
                </Button>
              </div>
            </div>
          </>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-lynx-500 text-white hover:bg-lynx-600"
        >
          {loading ? "登录中…" : "登录"}
          {!loading ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>
      </form>

      {/* 分隔符 */}
      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">或</span>
        <Separator className="flex-1" />
      </div>

      {/* 第三方登录占位 */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" disabled>
          GitHub
        </Button>
        <Button variant="outline" disabled>
          微信
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        还没有账号？{" "}
        <Link
          href="/register"
          className="font-medium text-lynx-600 hover:text-lynx-500 dark:text-lynx-400"
        >
          立即注册
        </Link>
      </p>
    </div>
  );
}
