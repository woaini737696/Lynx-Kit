"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, ShieldCheck, Eye, EyeOff, ArrowRight, User, Check } from "lucide-react";
import { Button, Input, Label } from "@lynxkit/ui-web";
import { toast } from "@lynxkit/ui-web";
import { useAuthStore } from "@lynxkit/store";
import { authApi } from "@/lib/api";
import { phoneSchema } from "@lynxkit/shared";

/**
 * 注册页 · 手机号 + 验证码 + 密码 + 确认密码 + 昵称 + 服务条款
 *
 * - 去除邮箱字段
 * - 验证码 60s 倒计时（scene: 'register'）
 * - 密码强度指示器（8 级灰阶）
 * - 确认密码前端一致性校验
 * - 注册成功后自动登录并跳转首页
 * - Liquid Glass 毛玻璃质感
 */
export default function RegisterPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [phone, setPhone] = React.useState("");
  const [code, setCode] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [name, setName] = React.useState("");
  const [agree, setAgree] = React.useState(false);
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

  // 确认密码一致性（仅在有输入时提示）
  const confirmTouched = confirm.length > 0;
  const passwordsMatch = password === confirm;

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
      const res = await authApi.sendCode(phone, "register");
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
    if (!agree) {
      toast({ title: "请先同意用户协议与隐私政策", variant: "destructive" });
      return;
    }
    if (confirmTouched && !passwordsMatch) {
      toast({ title: "两次输入的密码不一致", variant: "destructive" });
      return;
    }
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      toast({ title: "昵称长度需 2-50 位", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register({
        phone,
        code,
        password,
        name: trimmedName,
      });
      login(res.accessToken, res.user);
      toast({
        title: "注册成功",
        description: "欢迎加入妙想，开始你的造物之旅",
      });
      router.push("/membership");
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
      <h1 className="text-center text-[26px] font-semibold leading-[26px] tracking-[-0.02em] text-ink-950 dark:text-ink-50">
        创建账号
      </h1>
      <p className="mt-1 text-center text-sm leading-[22px] text-ink-500 dark:text-ink-400">
        加入超级个体的行列
      </p>

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

        {/* 验证码 */}
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

        {/* 密码 + 强度指示器 */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-ink-700 dark:text-ink-200">
            密码
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 8 位，需大写字母与数字"
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
          {/* 密码强度条 - 极简灰 */}
          {password.length > 0 ? (
            <div className="flex items-center gap-2">
              <div className="flex h-1 flex-1 gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-full flex-1 rounded-full transition-all duration-200 ${
                      i <= strength ? strengthColor : "bg-ink-100 dark:bg-ink-800"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-ink-500 dark:text-ink-400">{strengthLabel}</span>
            </div>
          ) : null}
        </div>

        {/* 确认密码 */}
        <div className="space-y-1.5">
          <Label htmlFor="confirm" className="text-ink-700 dark:text-ink-200">
            确认密码
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input
              id="confirm"
              type={showPassword ? "text" : "password"}
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="请再次输入密码"
              className="rounded-xl border-white/70 bg-white/55 pl-10 pr-10 backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/10"
            />
            {confirmTouched && passwordsMatch ? (
              <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-700 dark:text-ink-200" />
            ) : null}
          </div>
          {confirmTouched && !passwordsMatch ? (
            <p className="text-xs text-destructive">两次输入的密码不一致</p>
          ) : null}
        </div>

        {/* 昵称 */}
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-ink-700 dark:text-ink-200">
            昵称
          </Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input
              id="name"
              type="text"
              required
              minLength={2}
              maxLength={50}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="2-50 个字符"
              className="rounded-xl border-white/70 bg-white/55 pl-10 backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/10"
            />
          </div>
        </div>

        {/* 服务条款 */}
        <label className="flex items-start gap-2 text-sm leading-[22px] text-ink-500 dark:text-ink-400">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-ink-300 accent-ink-950 dark:accent-ink-100"
          />
          <span>
            我已阅读并同意
            <Link href="#" className="text-ink-950 hover:underline dark:text-ink-50">
              《用户协议》
            </Link>
            与
            <Link href="#" className="text-ink-950 hover:underline dark:text-ink-50">
              《隐私政策》
            </Link>
          </span>
        </label>

        <Button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-ink-950 text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)] transition-all duration-200 hover:bg-ink-800 hover:-translate-y-px disabled:translate-y-0 disabled:opacity-50 dark:bg-ink-100 dark:text-ink-950 dark:hover:bg-ink-200"
        >
          {loading ? "注册中…" : "注册"}
          {!loading ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm leading-[22px] text-ink-500 dark:text-ink-400">
        已有账号？{" "}
        <Link
          href="/login"
          className="font-medium text-ink-950 transition-colors duration-200 hover:text-ink-700 dark:text-ink-50 dark:hover:text-ink-200"
        >
          立即登录
        </Link>
      </p>
    </div>
  );
}
