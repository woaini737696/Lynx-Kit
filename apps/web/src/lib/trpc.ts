"use client";

import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";

// TODO: 当 apps/api（@lynxkit/api）就绪后，替换为：
// import type { AppRouter } from "@lynxkit/api";
// 当前 API 包尚未创建，先用 any 占位，保证 Web 端可独立构建与类型检查通过
// 运行时调用仍会真实发往 NEXT_PUBLIC_TRPC_URL，待后端接入后即获得完整类型安全
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AppRouter = any;

export const trpc = createTRPCReact<AppRouter>();

/**
 * tRPC 客户端 link 配置，指向后端 tRPC 端点
 */
export const trpcLink = httpBatchLink({
  url: process.env.NEXT_PUBLIC_TRPC_URL ?? "http://localhost:4000/trpc",
  // 自动注入 JWT token（从 localStorage 读取）
  async headers() {
    const token =
      typeof window !== "undefined" ? window.localStorage.getItem("lynxkit_token") : null;
    return token ? { authorization: `Bearer ${token}` } : {};
  },
});
