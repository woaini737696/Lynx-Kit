/**
 * 全屏认证弹窗（液态玻璃）
 *
 * 取代原 /login /register 路由页：
 *   - 背景：重度毛玻璃遮罩（.glass-overlay，blur 40px）
 *   - 容器：强液态玻璃（.glass-card-strong，blur 50px + saturate 200%）
 *   - 内含 Tab 切换（登录 / 注册），无路由跳转
 *   - 登录/注册成功后：
 *     - 若 ProtectedRoute 写入了 intendedPath → navigate(intendedPath)
 *     - 否则保持当前页（关闭弹窗即可）
 *
 * 设计依据：DESIGN_SYSTEM.md §5 液态玻璃 + §7.1 认证页
 */
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useAuthModal } from "@/store/auth-modal";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";

export function AuthModal() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { open, view, setView, closeAuthModal } = useAuthModal();

  // ESC / 点遮罩关闭由 Radix Dialog 处理；这里只需在 open=false 时清理
  const handleOpenChange = (next: boolean) => {
    if (!next) closeAuthModal();
  };

  // 登录/注册成功：先关弹窗，再按 intendedPath 跳转
  const handleSuccess = React.useCallback(() => {
    const target = useAuthModal.getState().intendedPath;
    closeAuthModal();
    if (target && target !== "/") {
      navigate(target, { replace: true });
    }
  }, [navigate, closeAuthModal]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        {/* 全屏毛玻璃遮罩 */}
        <DialogPrimitive.Overlay className="glass-overlay fixed inset-0 z-50 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
        {/* 弹窗主体：强液态玻璃容器（不渲染默认 close 按钮，自定义样式） */}
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="glass-card-strong fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 gap-0 p-8 data-[state=open]:animate-slide-up"
        >
          {/* 自定义右上角关闭按钮 */}
          <DialogPrimitive.Close
            aria-label={t("common.close")}
            title={t("common.close")}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-ink-100/60 text-ink-600 transition-colors hover:bg-ink-200/80 hover:text-ink-900 dark:bg-ink-800/60 dark:text-ink-300 dark:hover:bg-ink-700/80 dark:hover:text-ink-100"
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>

          {/* 视图切换 */}
          {view === "login" ? (
            <LoginForm
              onSuccess={handleSuccess}
              onSwitchToRegister={() => setView("register")}
            />
          ) : (
            <RegisterForm
              onSuccess={handleSuccess}
              onSwitchToLogin={() => setView("login")}
            />
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
