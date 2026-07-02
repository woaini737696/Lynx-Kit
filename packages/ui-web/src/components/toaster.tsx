import * as React from 'react';
import { createPortal } from 'react-dom';

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastTitle,
  dismiss,
  useToast,
} from './toast';

/**
 * Toaster —— 全局 Toast 渲染器。
 *
 * 在应用根部渲染一次即可，配合 `toast()` / `useToast()` 使用：
 *
 * ```tsx
 * import { Toaster, toast } from '@lynxkit/ui-web';
 *
 * <Toaster />
 * <button onClick={() => toast({ title: '已保存' })}>保存</button>
 * ```
 *
 * 实现说明：不依赖 sonner / @radix-ui/react-toast，
 * 通过 react-dom createPortal 挂载到 document.body。
 */
export function Toaster() {
  const { toasts } = useToast();

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed right-0 top-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:max-w-sm"
    >
      {toasts.map(({ id, title, description, variant }) => (
        <Toast key={id} variant={variant} onDismiss={() => dismiss(id)}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && (
              <ToastDescription>{description}</ToastDescription>
            )}
          </div>
          <ToastClose onClick={() => dismiss(id)} />
        </Toast>
      ))}
    </div>,
    document.body,
  );
}
