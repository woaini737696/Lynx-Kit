"use client";

import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@lynxkit/ui-web";
import { useAuthStore } from "@lynxkit/store";
import { authApi } from "@/lib/api";

/**
 * 认证 Hook
 *
 * 封装登录 / 注册 / 登出 / 获取当前用户，写回 @lynxkit/store 的 auth-store。
 * 登录方式：
 *   - 手机号 + 密码   login({ phone, password })
 *   - 手机号 + 验证码  loginByCode({ phone, code })
 * 登录成功后 token 持久化到 localStorage，后续请求自动注入 Authorization 头。
 */
export function useAuth() {
  const { t } = useTranslation();
  const { user, token, isAuthenticated, setUser, logout, updateProfile } =
    useAuthStore();

  const loginMutation = useMutation({
    mutationFn: ({ phone, password }: { phone: string; password: string }) =>
      authApi.login(phone, password),
    onSuccess: (res) => {
      setUser(res.user, res.accessToken);
      toast({ title: t("auth.loginSuccess"), variant: "success" });
    },
  });

  const loginByCodeMutation = useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) =>
      authApi.loginByCode(phone, code),
    onSuccess: (res) => {
      setUser(res.user, res.accessToken);
      toast({ title: t("auth.loginSuccess"), variant: "success" });
    },
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (res) => {
      setUser(res.user, res.accessToken);
      toast({ title: t("auth.registerSuccess"), variant: "success" });
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
    loginByCode: loginByCodeMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    fetchMe,
    updateProfile,
    isPending:
      loginMutation.isPending ||
      loginByCodeMutation.isPending ||
      registerMutation.isPending ||
      logoutMutation.isPending,
  };
}
