"use client";

import * as React from "react";

import type { ToastProps } from "@/components/ui/toast";

// 简易 Toast 状态管理（基于模块级订阅，避免多余 context 嵌套）
type Toast = ToastProps & {
  id: string;
  title?: string;
  description?: string;
};

type State = { toasts: Toast[] };

const listeners: Array<(state: State) => void> = [];
let state: State = { toasts: [] };
const TOAST_LIMIT = 3;
const TOAST_TIMEOUT = 4000;

function setState(next: State) {
  state = next;
  listeners.forEach((l) => l(state));
}

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

export function toast({
  title,
  description,
  variant,
}: {
  title?: string;
  description?: string;
  variant?: ToastProps["variant"];
}) {
  const id = genId();
  setState({
    toasts: [
      { id, title, description, variant },
      ...state.toasts,
    ].slice(0, TOAST_LIMIT),
  });
  window.setTimeout(() => dismiss(id), TOAST_TIMEOUT);
}

export function dismiss(id: string) {
  setState({ toasts: state.toasts.filter((t) => t.id !== id) });
}

export function useToast() {
  const [current, setCurrent] = React.useState<State>(state);
  React.useEffect(() => {
    listeners.push(setCurrent);
    return () => {
      const i = listeners.indexOf(setCurrent);
      if (i > -1) listeners.splice(i, 1);
    };
  }, []);
  return { ...current, toast, dismiss };
}
