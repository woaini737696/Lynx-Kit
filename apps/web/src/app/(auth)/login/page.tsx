"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight } from "lucide-react";
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
        login(res.accessToken, res.user);
        toast({ title: "登录成功", description: `欢迎回来，${res.user.name ?? "创作者"}` });
      } else {
        toast({
          title: "暂未开放",
          description: "手机号登录将在后续版本支持",
          variant: "destructive",
        });
        return;
      }
      router.push("/store");
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
      <h1 className="text-center text-2xl font-bold tracking-[-0.02em] text-ink-950 dark:text-ink-50">
        登录
      </h1>
      <p className="mt-1 text-center text-sm text-ink-500 dark:text-ink-400">继续你的造物之旅</p>

      {/* Tab 切换 - 玻璃胶囊 */}
      <div className="mt-6 flex justify-center">
        <div className="inline-flex rounded-full border border-white/70 bg-white/55 p-1 text-sm backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/10">
          <button
            type="button"
            onClick={() => setMode("email")}
            className={
              mode === "email"
                ? "rounded-full bg-ink-950 px-4 py-1.5 font-medium text-white shadow-sm dark:bg-ink-100 dark:text-ink-950"
                : "px-4 py-1.5 text-ink-500 dark:text-ink-400"
            }
          >
            邮箱
          </button>
          <button
            type="button"
            onClick={() => setMode("phone")}
            className={
              mode === "phone"
                ? "rounded-full bg-ink-950 px-4 py-1.5 font-medium text-white shadow-sm dark:bg-ink-100 dark:text-ink-950"
                : "px-4 py-1.5 text-ink-500 dark:text-ink-400"
            }
          >
            手机号
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === "email" ? (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-ink-700 dark:text-ink-200">
                邮箱
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="rounded-xl border-white/70 bg-white/55 pl-10 backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-ink-700 dark:text-ink-200">
                  密码
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-ink-500 hover:text-ink-950 dark:text-ink-400 dark:hover:text-ink-50"
                >
                  忘记密码？
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="rounded-xl border-white/70 bg-white/55 pl-10 backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/10"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-ink-700 dark:text-ink-200">
                手机号
              </Label>
              <Input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入手机号"
                className="rounded-xl border-white/70 bg-white/55 backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-ink-700 dark:text-ink-200">
                验证码
              </Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  type="text"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="6 位验证码"
                  className="rounded-xl border-white/70 bg-white/55 backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/10"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-ink-200 bg-white/55 text-ink-700 backdrop-blur-xl dark:border-ink-700 dark:bg-white/10 dark:text-ink-200"
                >
                  发送验证码
                </Button>
              </div>
            </div>
          </>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-ink-950 text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)] transition-all hover:bg-ink-800 hover:translate-y-[-1px] dark:bg-ink-100 dark:text-ink-950 dark:hover:bg-ink-200"
        >
          {loading ? "登录中…" : "登录"}
          {!loading ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>
      </form>

      {/* 分隔符 */}
      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1 bg-ink-200/60 dark:bg-ink-700/60" />
        <span className="text-xs text-ink-400 dark:text-ink-500">或</span>
        <Separator className="flex-1 bg-ink-200/60 dark:bg-ink-700/60" />
      </div>

      {/* 第三方登录占位 */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          disabled
          className="rounded-xl border-ink-200 bg-white/55 text-ink-500 backdrop-blur-xl dark:border-ink-700 dark:bg-white/10 dark:text-ink-400"
        >
          GitHub
        </Button>
        <Button
          variant="outline"
          disabled
          className="rounded-xl border-ink-200 bg-white/55 text-ink-500 backdrop-blur-xl dark:border-ink-700 dark:bg-white/10 dark:text-ink-400"
        >
          微信
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-ink-500 dark:text-ink-400">
        还没有账号？{" "}
        <Link
          href="/register"
          className="font-medium text-ink-950 hover:underline dark:text-ink-50"
        >
          立即注册
        </Link>
      </p>
    </div>
  );
}
