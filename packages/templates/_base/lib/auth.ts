/**
 * 认证逻辑封装（基于 NextAuth.js）
 *
 * 提供占位实现，业务方接入实际项目时需：
 *   1. 安装 next-auth @auth/prisma-adapter
 *   2. 配置 route handlers（app/api/auth/[...nextauth]/route.ts）
 *   3. 在根 Layout 包裹 <SessionProvider>
 *   4. 替换下方占位逻辑
 */

import type * as React from "react";

export type Role = "admin" | "user" | "guest";

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
  role: Role;
}

/**
 * 客户端 useAuth hook 占位
 * 真实场景下从 next-auth/react 引入 useSession
 */
export function useAuth(): { user: AuthUser | null; status: "loading" | "authenticated" | "unauthenticated" } {
  // 占位：业务方接入后替换为 useSession 实现
  return {
    user: null,
    status: "unauthenticated",
  };
}

/**
 * 服务端 requireAuth 守卫
 * 在 getServerSideProps 或 middleware 中使用
 *
 * @example
 * export async function getServerSideProps(ctx) {
 *   const result = await requireAuth(ctx);
 *   if ("redirect" in result) return result;
 *   return { props: { user: result.user } };
 * }
 */
export async function requireAuth(ctx: {
  req: { url?: string };
  res: unknown;
}): Promise<{ user: AuthUser } | { redirect: { destination: string; permanent: false } }> {
  // 占位：业务方接入后实际读取 session
  const user: AuthUser | null = null;
  if (!user) {
    return {
      redirect: {
        destination: `/login?callbackUrl=${encodeURIComponent(ctx.req.url || "/")}`,
        permanent: false,
      },
    };
  }
  return { user };
}

/**
 * 角色/权限校验守卫
 */
export function requireRole(role: Role) {
  return (user?: AuthUser | null) => {
    if (!user) return false;
    if (role === "admin") return user.role === "admin";
    return user.role === "admin" || user.role === "user";
  };
}

/**
 * 退出登录占位
 */
export async function signOut(options?: { callbackUrl?: string }): Promise<void> {
  // 占位：业务方接入后调用 next-auth signOut
  if (options?.callbackUrl && typeof window !== "undefined") {
    window.location.href = options.callbackUrl;
  }
}

/**
 * 登录占位
 */
export async function signIn(
  provider: string,
  options?: { email?: string; password?: string; callbackUrl?: string },
): Promise<void> {
  // 占位：业务方接入后调用 next-auth signIn
  void provider;
  void options;
}

/**
 * SessionProvider 包装占位
 */
export function AuthSessionProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  // 占位：业务方接入后从 next-auth/react 引入 SessionProvider
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return children as any;
}
