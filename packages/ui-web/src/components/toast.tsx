import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';

import { cn } from '../lib/utils.js';

/* ------------------------------------------------------------------ */
/*  视觉组件                                                           */
/* ------------------------------------------------------------------ */

const toastVariants = cva(
  'pointer-events-auto relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-md border p-4 pr-6 shadow-lg transition-all',
  {
    variants: {
      variant: {
        default: 'border bg-background text-foreground',
        destructive:
          'border-destructive bg-destructive text-destructive-foreground',
        success: 'border-transparent bg-lynx-500 text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
  onDismiss?: () => void;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant, onDismiss, children, ...props }, ref) => (
    <div
      ref={ref}
      role="status"
      className={cn(toastVariants({ variant }), 'animate-slide-up', className)}
      {...props}
    >
      {children}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="关闭通知"
          className={cn(
            'absolute right-1.5 top-1.5 rounded-md p-1 opacity-60 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring',
          )}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  ),
);
Toast.displayName = 'Toast';

const ToastTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm font-semibold', className)}
    {...props}
  />
));
ToastTitle.displayName = 'ToastTitle';

const ToastDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm opacity-90', className)}
    {...props}
  />
));
ToastDescription.displayName = 'ToastDescription';

const ToastClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    aria-label="关闭通知"
    className={cn(
      'absolute right-1.5 top-1.5 rounded-md p-1 opacity-60 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring',
      className,
    )}
    {...props}
  >
    <X className="h-4 w-4" />
  </button>
));
ToastClose.displayName = 'ToastClose';

/* ------------------------------------------------------------------ */
/*  自定义 Toast 状态管理（模块级订阅，无 Context / 无 sonner）         */
/* ------------------------------------------------------------------ */

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: VariantProps<typeof toastVariants>['variant'];
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: string;
}

type ToastState = { toasts: ToastItem[] };

const TOAST_LIMIT = 3;
const DEFAULT_DURATION = 4000;

let state: ToastState = { toasts: [] };
const listeners = new Set<(state: ToastState) => void>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

function setState(next: ToastState) {
  state = next;
  for (const listener of listeners) {
    listener(state);
  }
}

function genId(): string {
  return Math.random().toString(36).slice(2, 9);
}

function dismiss(id: string) {
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
  setState({ toasts: state.toasts.filter((t) => t.id !== id) });
}

function toast(options: ToastOptions): string {
  const id = genId();
  const duration = options.duration ?? DEFAULT_DURATION;

  setState({
    toasts: [{ id, ...options }, ...state.toasts].slice(0, TOAST_LIMIT),
  });

  const timer = setTimeout(() => dismiss(id), duration);
  timers.set(id, timer);

  return id;
}

function useToast() {
  const [current, setCurrent] = React.useState<ToastState>(state);

  React.useEffect(() => {
    listeners.add(setCurrent);
    return () => {
      listeners.delete(setCurrent);
    };
  }, []);

  return {
    toasts: current.toasts,
    toast,
    dismiss,
  };
}

export { toast, dismiss, useToast, toastVariants };
