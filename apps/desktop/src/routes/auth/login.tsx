import * as React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, LogIn, X, Phone, Lock, ShieldCheck } from "lucide-react";
import { Input, Label, toast, cn } from "@lynxkit/ui-web";
import { useAuth } from "@/hooks/use-auth";
import { authApi } from "@/lib/api";

/** 中国大陆手机号格式（与 @lynxkit/shared phoneSchema 对齐） */
const PHONE_RE = /^1[3-9]\d{9}$/;
/** 验证码倒计时秒数 */
const COUNTDOWN_SECONDS = 60;

type LoginTab = "password" | "code";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { login, loginByCode, isPending } = useAuth();

  const [tab, setTab] = React.useState<LoginTab>("password");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");
  const [countdown, setCountdown] = React.useState(0);
  const [sendingCode, setSendingCode] = React.useState(false);

  // 登录成功后回到登录前试图访问的路径，缺省回首页
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  // 60s 倒计时
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
      navigate(from, { replace: true });
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
      navigate(from, { replace: true });
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
    <div className="auth-bg fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-10">
      {/* 关闭按钮：返回首页 */}
      <button
        type="button"
        onClick={() => navigate("/", { replace: true })}
        aria-label={t("common.close")}
        title={t("common.close")}
        className="glass-card absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-ink-600 transition-colors hover:text-ink-900"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="glass-card relative z-10 w-full max-w-[400px] p-8 animate-slide-up">
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

        {/* Tab 1：手机号 + 密码 */}
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

        {/* Tab 2：手机号 + 验证码 */}
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

        {/* 注册链接 */}
        <p className="mt-6 text-center text-sm text-ink-500">
          {t("auth.noAccount")}{" "}
          <Link
            to="/register"
            className="font-medium text-ink-950 underline-offset-4 hover:underline"
          >
            {t("auth.registerLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  内联字段组件（保持单文件，遵循 DESIGN_SYSTEM 视觉规范）            */
/* ------------------------------------------------------------------ */

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-medium text-ink-600">
        {label}
      </Label>
      {children}
    </div>
  );
}

/** 带前缀图标的玻璃输入框 */
function IconInput({
  icon,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400">
        {icon}
      </span>
      <Input
        {...props}
        className={cn(
          "input-glass h-[44px] w-full pl-10 text-sm text-ink-900",
          className,
        )}
      />
    </div>
  );
}

/** 手机号输入框（+86 前缀） */
function PhoneInput({
  id,
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="input-glass flex h-[44px] items-center gap-2">
      <span className="flex items-center gap-1.5 border-r border-ink-300/70 pl-3.5 pr-2.5 text-sm font-medium text-ink-700">
        <Phone className="h-3.5 w-3.5 text-ink-400" />
        +86
      </span>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 11))}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="tel"
        className="h-full w-full bg-transparent pr-3.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
      />
    </div>
  );
}
