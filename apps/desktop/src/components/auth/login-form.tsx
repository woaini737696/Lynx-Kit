/**
 * 登录表单（弹窗内）
 *
 * 从原 routes/auth/login.tsx 提取表单逻辑：
 *   - 双 Tab（密码 / 验证码）
 *   - 手机号 + 密码登录
 *   - 手机号 + 验证码登录
 *
 * 与原路由版本差异：
 *   - 不再渲染外层 auth-bg / glass-card 容器（由 AuthModal 提供）
 *   - 不再渲染关闭按钮（由 AuthModal 提供）
 *   - 登录成功后由 AuthModal 处理 navigate（基于 intendedPath），这里只调 onSuccess
 *   - "去注册" 链接改为调 onSwitchToRegister 切换 Tab
 */
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Loader2, LogIn, Lock, ShieldCheck } from "lucide-react";
import { toast, cn } from "@lynxkit/ui-web";
import { useAuth } from "@/hooks/use-auth";
import { authApi } from "@/lib/api";
import { Field, IconInput, PhoneInput } from "./form-fields";

const PHONE_RE = /^1[3-9]\d{9}$/;
const COUNTDOWN_SECONDS = 60;

type LoginTab = "password" | "code";

interface LoginFormProps {
  /** 登录成功后回调（由 AuthModal 处理跳转 + 关闭） */
  onSuccess: () => void;
  /** 切换到注册视图 */
  onSwitchToRegister: () => void;
}

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const { t } = useTranslation();
  const { login, loginByCode, isPending } = useAuth();

  const [tab, setTab] = React.useState<LoginTab>("password");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");
  const [countdown, setCountdown] = React.useState(0);
  const [sendingCode, setSendingCode] = React.useState(false);

  React.useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setInterval(() => {
      setCountdown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [countdown]);

  const phoneValid = PHONE_RE.test(phone);
  const codeValid = /^\d{6}$/.test(code);

  const handleSendCode = async () => {
    if (!phoneValid) {
      toast({ title: t("auth.phoneInvalid"), variant: "destructive" });
      return;
    }
    if (countdown > 0 || sendingCode) return;
    setSendingCode(true);
    try {
      const res = await authApi.sendCode(phone, "login");
      if (res.sent) {
        toast({ title: t("auth.codeSent"), variant: "success" });
        setCountdown(COUNTDOWN_SECONDS);
      } else if (res.cooldown && res.cooldown > 0) {
        setCountdown(res.cooldown);
      }
    } catch (err) {
      toast({
        title: t("auth.loginFailed"),
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setSendingCode(false);
    }
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneValid || !password) {
      toast({ title: t("auth.fillPhoneAndPassword"), variant: "destructive" });
      return;
    }
    try {
      await login({ phone, password });
      onSuccess();
    } catch (err) {
      toast({
        title: t("auth.loginFailed"),
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    }
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneValid || !codeValid) {
      toast({ title: t("auth.fillPhoneAndCode"), variant: "destructive" });
      return;
    }
    try {
      await loginByCode({ phone, code });
      onSuccess();
    } catch (err) {
      toast({
        title: t("auth.loginFailed"),
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    }
  };

  const sendingDisabled = countdown > 0 || sendingCode || !phoneValid;

  return (
    <>
      {/* 标题 */}
      <header className="mb-7 text-center">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-ink-950 text-ink-0 shadow-lg">
          <LogIn className="h-5 w-5" />
        </div>
        <h1 className="text-[22px] font-semibold tracking-tight text-ink-900">
          {t("auth.loginTitle")}
        </h1>
        <p className="mt-1.5 text-sm text-ink-500">{t("auth.loginSubtitle")}</p>
      </header>

      {/* Tab 切换：密码登录 / 验证码登录 */}
      <div className="mb-6 flex rounded-full bg-ink-200/70 p-1 dark:bg-ink-800/40">
        {(
          [
            { key: "password", label: t("auth.tabPassword") },
            { key: "code", label: t("auth.tabCode") },
          ] as { key: LoginTab; label: string }[]
        ).map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setTab(opt.key)}
            className={cn(
              "flex-1 rounded-full py-2 text-sm font-medium transition-all duration-200",
              tab === opt.key
                ? "bg-ink-950 text-ink-0 shadow-sm"
                : "text-ink-500 hover:text-ink-800",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {tab === "password" && (
        <form onSubmit={submitPassword} className="space-y-4">
          <Field label={t("auth.phone")} htmlFor="login-phone">
            <PhoneInput
              id="login-phone"
              value={phone}
              onChange={setPhone}
              placeholder={t("auth.phonePlaceholder")}
              autoFocus
            />
          </Field>
          <Field label={t("auth.password")} htmlFor="login-password">
            <IconInput
              id="login-password"
              type="password"
              icon={<Lock className="h-4 w-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.passwordPlaceholder")}
              autoComplete="current-password"
            />
          </Field>
          <button
            type="submit"
            disabled={isPending}
            className="btn-ink flex w-full items-center justify-center gap-2"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            {t("auth.loginButton")}
          </button>
        </form>
      )}

      {tab === "code" && (
        <form onSubmit={submitCode} className="space-y-4">
          <Field label={t("auth.phone")} htmlFor="login-phone-code">
            <PhoneInput
              id="login-phone-code"
              value={phone}
              onChange={setPhone}
              placeholder={t("auth.phonePlaceholder")}
              autoFocus
            />
          </Field>
          <Field label={t("auth.code")} htmlFor="login-code">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <IconInput
                  id="login-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  icon={<ShieldCheck className="h-4 w-4" />}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder={t("auth.codePlaceholder")}
                  autoComplete="one-time-code"
                />
              </div>
              <button
                type="button"
                onClick={handleSendCode}
                disabled={sendingDisabled}
                className={cn(
                  "input-glass flex h-[44px] min-w-[112px] items-center justify-center whitespace-nowrap px-3 text-sm font-medium transition-all",
                  sendingDisabled
                    ? "cursor-not-allowed text-ink-400 opacity-70"
                    : "text-ink-900 hover:border-ink-400 hover:bg-glass-bg-strong",
                )}
              >
                {countdown > 0
                  ? t("auth.countdown", { seconds: countdown })
                  : sendingCode
                    ? t("common.loading")
                    : t("auth.sendCode")}
              </button>
            </div>
          </Field>
          <button
            type="submit"
            disabled={isPending}
            className="btn-ink flex w-full items-center justify-center gap-2"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            {t("auth.loginButton")}
          </button>
        </form>
      )}

      {/* 切换到注册 */}
      <p className="mt-6 text-center text-sm text-ink-500">
        {t("auth.noAccount")}{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-medium text-ink-950 underline-offset-4 hover:underline"
        >
          {t("auth.registerLink")}
        </button>
      </p>
    </>
  );
}
