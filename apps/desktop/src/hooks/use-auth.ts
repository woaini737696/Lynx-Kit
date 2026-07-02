"use client";

import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@lynxkit/ui-web";
import { useAuthStore } from "@lynxkit/store";
import { authApi } from "@/lib/api";

/**
 * 认证 Hook
 *
 * 封装登录 / 注册 / 登出 / 获取当前用户，写回 @lynxkit/store 的 auth-store。
 * 登录成功后 token 持久化到 localStorage，后续请求自动注入 Authorization 头。
 */
export function useAuth() {
  const { user, token, isAuthenticated, setUser, logout, updateProfile } =
    useAuthStore();

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: (res) => {
      setUser(res.user, res.token);
      toast({ title: "登录成功", variant: "success" });
    },
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (res) => {
      setUser(res.user, res.token);
      toast({ title: "注册成功，已自动登录", variant: "success" });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      logout();
    },
  });

  const fetchMe = useCallback(async () => {
    const me = await authApi.me();
    if (token) setUser(me, token);
    return me;
  }, [token, setUser]);

  return {
    user,
    token,
    isAuthenticated,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    fetchMe,
    updateProfile,
    isPending:
      loginMutation.isPending ||
      registerMutation.isPending ||
      logoutMutation.isPending,
  };
}
