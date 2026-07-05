/**
 * 注册表单（弹窗内）
 *
 * 从原 routes/auth/register.tsx 提取表单逻辑：
 *   - 手机号 + 验证码 + 密码 + 确认密码 + 昵称 + 服务条款
 *   - 密码强度 3 段指示器
 *   - 规则校验提示
 *
 * 与原路由版本差异：
 *   - 不再渲染外层 auth-bg / glass-card 容器（由 AuthModal 提供）
 *   - 不再渲染关闭按钮（由 AuthModal 提供）
 *   - 注册成功后由 AuthModal 处理 navigate，这里只调 onSuccess
 *   - "去登录" 链接改为调 onSwitchToLogin 切换 Tab
 */
import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Loader2,
  UserPlus,
  Lock,
  ShieldCheck,
  User,
  Check,
  Link2,
} from "lucide-react";
import { toast, cn } from "@lynxkit/ui-web";
import { useAuth } from "@/hooks/use-auth";
import { authApi } from "@/lib/api";
import { Field, IconInput, PhoneInput } from "./form-fields";

const PHONE_RE = /^1[3-9]\d{9}$/;
const COUNTDOWN_SECONDS = 60;

type Strength = 0 | 1 | 2 | 3;

function calcStrength(pw: string): Strength {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (score >= 3 && pw.length >= 12) score = 3;
  return Math.min(score, 3) as Strength;
}

interface RegisterFormProps {
  /** 注册成功后回调 */
  onSuccess: () => void;
  /** 切换到登录视图 */
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const { t } = useTranslation();
  const { register, isPending } = useAuth();

  const [phone, setPhone] = React.useState("");
  const [code, setCode] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [agreed, setAgreed] = React.useState(false);

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
  const strength = calcStrength(password);
  const rules = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    digit: /[0-9]/.test(password),
  };
  const nameValid = name.length >= 2 && name.length <= 50;
  const passwordValid = rules.length && rules.upper && rules.digit;
  const confirmMatch =
    confirmPassword.length > 0 && confirmPassword === password;

  const handleSendCode = async () => {
    if (!phoneValid) {
      toast({ title: t("auth.phoneInvalid"), variant: "destructive" });
      return;
    }
    if (countdown > 0 || sendingCode) return;
    setSendingCode(true);
    try {
      const res = await authApi.sendCode(phone, "register");
      if (res.sent) {
        toast({ title: t("auth.codeSent"), variant: "success" });
        setCountdown(COUNTDOWN_SECONDS);
      } else if (res.cooldown && res.cooldown > 0) {
        setCountdown(res.cooldown);
      }
    } catch (err) {
      toast({
        title: t("auth.registerFailed"),
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setSendingCode(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneValid) {
      toast({ title: t("auth.phoneInvalid"), variant: "destructive" });
      return;
    }
    if (!codeValid) {
      toast({ title: t("auth.codeInvalid"), variant: "destructive" });
      return;
    }
    if (!passwordValid) {
      toast({ title: t("auth.passwordMinHint"), variant: "destructive" });
      return;
    }
    if (!confirmMatch) {
      toast({ title: t("auth.passwordMismatch"), variant: "destructive" });
      return;
    }
    if (!nameValid) {
      toast({ title: t("auth.nameRange"), variant: "destructive" });
      return;
    }
    if (!agreed) {
      toast({ title: t("auth.termsRequired"), variant: "destructive" });
      return;
    }
    try {
      await register({ phone, code, password, name });
      onSuccess();
    } catch (err) {
      toast({
        title: t("auth.registerFailed"),
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    }
  };

  const sendingDisabled = countdown > 0 || sendingCode || !phoneValid;

  const strengthLabel =
    strength === 0
      ? ""
      : strength === 1
        ? t("auth.strengthWeak")
        : strength === 2
          ? t("auth.strengthMedium")
          : t("auth.strengthStrong");

  return (
    <>
      <header className="mb-7 text-center">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-ink-950 text-ink-0 shadow-lg">
          <UserPlus className="h-5 w-5" />
        </div>
        <h1 className="text-[22px] font-semibold tracking-tight text-ink-900">
          {t("auth.registerTitle")}
        </h1>
        <p className="mt-1.5 text-sm text-ink-500">
          {t("auth.registerSubtitle")}
        </p>
      </header>

      <form onSubmit={submit} className="space-y-4">
        <Field label={t("auth.phone")} htmlFor="reg-phone">
          <PhoneInput
            id="reg-phone"
            value={phone}
            onChange={setPhone}
            placeholder={t("auth.phonePlaceholder")}
            autoFocus
          />
        </Field>

        <Field label={t("auth.code")} htmlFor="reg-code">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <IconInput
                id="reg-code"
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

        <Field label={t("auth.password")} htmlFor="reg-password">
          <IconInput
            id="reg-password"
            type="password"
            icon={<Lock className="h-4 w-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("auth.passwordPlaceholder")}
            autoComplete="new-password"
          />
          {password && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex flex-1 gap-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors duration-200",
                      strength >= i ? "bg-ink-950" : "bg-ink-200",
                    )}
                  />
                ))}
              </div>
              <span className="w-8 text-right text-xs font-medium text-ink-600">
                {strengthLabel}
              </span>
            </div>
          )}
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">
            <RuleChip ok={rules.length} label={t("auth.passwordRuleLength")} />
            <RuleChip ok={rules.upper} label={t("auth.passwordRuleUpper")} />
            <RuleChip ok={rules.digit} label={t("auth.passwordRuleDigit")} />
          </div>
        </Field>

        <Field label={t("auth.confirmPassword")} htmlFor="reg-confirm">
          <IconInput
            id="reg-confirm"
            type="password"
            icon={<Lock className="h-4 w-4" />}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t("auth.confirmPasswordPlaceholder")}
            autoComplete="new-password"
            aria-invalid={confirmPassword.length > 0 && !confirmMatch}
          />
          {confirmPassword.length > 0 && !confirmMatch && (
            <p className="mt-1.5 text-xs text-ink-500">
              {t("auth.passwordMismatch")}
            </p>
          )}
        </Field>

        <Field label={t("auth.name")} htmlFor="reg-name">
          <IconInput
            id="reg-name"
            type="text"
            icon={<User className="h-4 w-4" />}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("auth.namePlaceholder")}
            maxLength={50}
            autoComplete="nickname"
          />
        </Field>

        <label
          htmlFor="reg-terms"
          className="flex cursor-pointer items-start gap-2.5 pt-1"
        >
          <button
            id="reg-terms"
            type="button"
            role="checkbox"
            aria-checked={agreed}
            onClick={() => setAgreed((v) => !v)}
            className={cn(
              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all",
              agreed
                ? "border-ink-950 bg-ink-950 text-ink-0"
                : "border-ink-300 bg-transparent hover:border-ink-500",
            )}
          >
            {agreed && <Check className="h-3.5 w-3.5" />}
          </button>
          <span className="text-xs leading-relaxed text-ink-600">
            {t("auth.termsAgree")}{" "}
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="inline-flex items-center gap-0.5 font-medium text-ink-950 underline-offset-4 hover:underline"
            >
              {t("auth.termsLink")}
              <Link2 className="h-3 w-3" />
            </a>
          </span>
        </label>

        <button
          type="submit"
          disabled={isPending}
          className="btn-ink flex w-full items-center justify-center gap-2"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          {t("auth.registerAndLogin")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        {t("auth.hasAccount")}{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-medium text-ink-950 underline-offset-4 hover:underline"
        >
          {t("auth.loginLink")}
        </button>
      </p>
    </>
  );
}

/** 密码规则提示小条（满足时高亮为纯黑） */
function RuleChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs transition-colors",
        ok ? "text-ink-950" : "text-ink-400",
      )}
    >
      <span
        className={cn(
          "flex h-3.5 w-3.5 items-center justify-center rounded-full border transition-colors",
          ok ? "border-ink-950 bg-ink-950 text-ink-0" : "border-ink-300",
        )}
      >
        {ok && <Check className="h-2.5 w-2.5" />}
      </span>
      {label}
    </span>
  );
}
