"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import { Button, Input, Label, Separator } from "@lynxkit/ui-web";
import { toast } from "@lynxkit/ui-web";
import { useAuthStore } from "@lynxkit/store";
import { authApi } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [agree, setAgree] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // 密码强度（0-4）
  const strength = React.useMemo(() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  }, [password]);

  const strengthLabel = ["", "弱", "中", "强", "极强"][strength];
  const strengthColor = [
    "bg-ink-200 dark:bg-ink-700",
    "bg-ink-400 dark:bg-ink-500",
    "bg-ink-600 dark:bg-ink-400",
    "bg-ink-800 dark:bg-ink-300",
    "bg-ink-950 dark:bg-ink-100",
  ][strength];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agree) {
      toast({ title: "请先同意用户协议", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register({
        email,
        password,
        name: name || email.split("@")[0] || email,
      });
      login(res.accessToken, res.user);
      toast({ title: "注册成功", description: "欢迎加入 妙想，开始你的造物之旅" });
      router.push("/store");
    } catch (err) {
      toast({
        title: "注册失败",
        description: err instanceof Error ? err.message : "请检查输入",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-center text-2xl font-bold tracking-[-0.02em] text-ink-950 dark:text-ink-50">
        创建账号
      </h1>
      <p className="mt-1 text-center text-sm text-ink-500 dark:text-ink-400">
        加入超级个体的行列
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-ink-700 dark:text-ink-200">
            昵称（可选）
          </Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="你的昵称"
              className="rounded-xl border-white/70 bg-white/55 pl-10 backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/10"
            />
          </div>
        </div>
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
          <Label htmlFor="password" className="text-ink-700 dark:text-ink-200">
            密码
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 8 位，含大写字母与数字"
              className="rounded-xl border-white/70 bg-white/55 pl-10 backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/10"
            />
          </div>
          {/* 密码强度条 - 极简灰 */}
          {password.length > 0 ? (
            <div className="flex items-center gap-2">
              <div className="flex h-1 flex-1 gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-full flex-1 rounded-full transition-all ${
                      i <= strength ? strengthColor : "bg-ink-100 dark:bg-ink-800"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-ink-500 dark:text-ink-400">{strengthLabel}</span>
            </div>
          ) : null}
        </div>

        <label className="flex items-start gap-2 text-sm text-ink-500 dark:text-ink-400">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-ink-300 accent-ink-950 dark:accent-ink-100"
          />
          <span>
            我已阅读并同意
            <Link href="/terms" className="text-ink-950 hover:underline dark:text-ink-50">
              《用户协议》
            </Link>
            与
            <Link href="/privacy" className="text-ink-950 hover:underline dark:text-ink-50">
              《隐私政策》
            </Link>
          </span>
        </label>

        <Button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-ink-950 text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)] transition-all hover:bg-ink-800 hover:translate-y-[-1px] dark:bg-ink-100 dark:text-ink-950 dark:hover:bg-ink-200"
        >
          {loading ? "注册中…" : "注册"}
          {!loading ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1 bg-ink-200/60 dark:bg-ink-700/60" />
        <span className="text-xs text-ink-400 dark:text-ink-500">或</span>
        <Separator className="flex-1 bg-ink-200/60 dark:bg-ink-700/60" />
      </div>

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
        已有账号？{" "}
        <Link href="/login" className="font-medium text-ink-950 hover:underline dark:text-ink-50">
          立即登录
        </Link>
      </p>
    </div>
  );
}
