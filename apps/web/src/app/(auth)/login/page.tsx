"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, ShieldCheck, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button, Input, Label } from "@lynxkit/ui-web";
import { toast } from "@lynxkit/ui-web";
import { useAuthStore } from "@lynxkit/store";
import { authApi } from "@/lib/api";
import { phoneSchema } from "@lynxkit/shared";

type Mode = "password" | "code";

/**
 * 登录页 · 手机号 + 密码 / 手机号 + 验证码
 *
 * - Tab 切换两种登录方式
 * - 验证码 60s 倒计时
 * - 密码显隐切换
 * - Liquid Glass 毛玻璃质感 + 8 级灰阶
 */
export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [mode, setMode] = React.useState<Mode>("password");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [sendingCode, setSendingCode] = React.useState(false);
  const [countdown, setCountdown] = React.useState(0);

  // 验证码倒计时
  React.useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  async function handleSendCode() {
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) {
      toast({
        title: "手机号格式错误",
        description: "请输入正确的 11 位手机号",
        variant: "destructive",
      });
      return;
    }
    setSendingCode(true);
    try {
      const res = await authApi.sendCode(phone, "login");
      if (res.sent) {
        setCountdown(60);
        toast({ title: "验证码已发送", description: "请查收短信" });
      } else if (res.cooldown && res.cooldown > 0) {
        setCountdown(res.cooldown);
        toast({
          title: "请稍后再试",
          description: `冷却剩余 ${res.cooldown} 秒`,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "验证码发送失败",
        description: err instanceof Error ? err.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setSendingCode(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res =
        mode === "password"
          ? await authApi.login(phone, password)
          : await authApi.loginByCode(phone, code);
      login(res.accessToken, res.user);
      toast({
        title: "登录成功",
        description: `欢迎回来，${res.user.name ?? "创作者"}`,
      });
      router.push("/");
    } catch (err) {
      toast({
        title: "登录失败",
        description: err instanceof Error ? err.message : "请检查手机号与凭据",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-center text-[26px] font-semibold leading-[26px] tracking-[-0.02em] text-ink-950 dark:text-ink-50">
        登录
      </h1>
      <p className="mt-1 text-center text-sm leading-[22px] text-ink-500 dark:text-ink-400">
        继续你的造物之旅
      </p>

      {/* Tab 切换 - 玻璃胶囊 */}
      <div className="mt-6 flex justify-center">
        <div className="inline-flex rounded-full border border-white/70 bg-white/55 p-1 text-sm backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/10">
          <button
            type="button"
            onClick={() => setMode("password")}
            className={
              mode === "password"
                ? "rounded-full bg-ink-950 px-4 py-1.5 font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-px dark:bg-ink-100 dark:text-ink-950"
                : "px-4 py-1.5 text-ink-500 transition-colors duration-200 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-200"
            }
          >
            密码登录
          </button>
          <button
            type="button"
            onClick={() => setMode("code")}
            className={
              mode === "code"
                ? "rounded-full bg-ink-950 px-4 py-1.5 font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-px dark:bg-ink-100 dark:text-ink-950"
                : "px-4 py-1.5 text-ink-500 transition-colors duration-200 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-200"
            }
          >
            验证码登录
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {/* 手机号 - +86 前缀 */}
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-ink-700 dark:text-ink-200">
            手机号
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-ink-600 dark:text-ink-300">
              +86
            </span>
            <span className="pointer-events-none absolute left-11 top-1/2 h-4 w-px -translate-y-1/2 bg-ink-300 dark:bg-ink-600" />
            <Input
              id="phone"
              type="tel"
              required
              inputMode="numeric"
              maxLength={11}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              placeholder="请输入手机号"
              className="rounded-xl border-white/70 bg-white/55 pl-14 backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/10"
            />
          </div>
        </div>

        {mode === "password" ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-ink-700 dark:text-ink-200">
                密码
              </Label>
              <Link
                href="#"
                className="text-xs text-ink-500 transition-colors duration-200 hover:text-ink-950 dark:text-ink-400 dark:hover:text-ink-50"
              >
                忘记密码？
              </Link>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="rounded-xl border-white/70 bg-white/55 pl-10 pr-10 backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "隐藏密码" : "显示密码"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 transition-colors duration-200 hover:text-ink-700 dark:hover:text-ink-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="code" className="text-ink-700 dark:text-ink-200">
              验证码
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <Input
                  id="code"
                  type="text"
                  required
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="6 位验证码"
                  className="rounded-xl border-white/70 bg-white/55 pl-10 backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/10"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={countdown > 0 || sendingCode}
                onClick={handleSendCode}
                className="h-10 w-[7.5rem] shrink-0 rounded-xl border-white/70 bg-white/55 px-3 text-sm text-ink-700 backdrop-blur-xl backdrop-saturate-150 transition-all duration-200 hover:-translate-y-px hover:bg-white/72 disabled:translate-y-0 disabled:opacity-50 dark:border-white/10 dark:bg-white/10 dark:text-ink-200 dark:hover:bg-white/20"
              >
                {countdown > 0 ? `${countdown}s 后重发` : sendingCode ? "发送中…" : "获取验证码"}
              </Button>
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-ink-950 text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)] transition-all duration-200 hover:bg-ink-800 hover:-translate-y-px disabled:translate-y-0 disabled:opacity-50 dark:bg-ink-100 dark:text-ink-950 dark:hover:bg-ink-200"
        >
          {loading ? "登录中…" : "登录"}
          {!loading ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm leading-[22px] text-ink-500 dark:text-ink-400">
        还没有账号？{" "}
        <Link
          href="/register"
          className="font-medium text-ink-950 transition-colors duration-200 hover:text-ink-700 dark:text-ink-50 dark:hover:text-ink-200"
        >
          立即注册
        </Link>
      </p>
    </div>
  );
}
