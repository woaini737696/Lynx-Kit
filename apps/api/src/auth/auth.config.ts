/**
 * NextAuth.js v5 配置（JWT 模式）
 *
 * 跨端鉴权策略：
 *   - Web 端：使用 NextAuth 标准流程（session cookie）
 *   - 桌面端 / 移动端：通过 Credentials Provider 登录后获取 JWT，
 *     后续请求在 Authorization header 中携带 Bearer token
 *
 * JWT 回调注入 user.id / user.role，session 回调暴露给客户端。
 *
 * 注意：
 *   - NextAuth v5 仍为 beta，API 可能微调。
 *   - 当前 schema 未包含 NextAuth 所需的 Account / Session / VerificationToken
 *     模型，因此暂不使用 PrismaAdapter（JWT 模式不需要）。
 *   - 后续接入 OAuth Provider（GitHub / Google）时，需要在 schema 中添加
 *     Account / Session / VerificationToken 表并启用 PrismaAdapter。
 *
 * TODO: 后续集成 OAuth Provider（GitHub / Google）以便用户注册更顺畅。
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import type { PrismaClient } from "@prisma/client";

import { verifyPassword } from "./password.js";

/**
 * NextAuth 扩展的 User 类型（包含 role）
 */
interface ExtendedUser {
  id: string;
  email: string;
  name?: string | null;
  role?: string;
}

/**
 * 创建 NextAuth 配置
 *
 * @param prisma PrismaClient 实例（用于查询用户表）
 */
export function createAuthConfig(prisma: PrismaClient) {
  return {
    // 注意：JWT 模式 + Credentials Provider 不需要 adapter
    // adapter: PrismaAdapter(prisma),
    session: {
      // 使用 JWT 模式（无服务端 session 存储，便于水平扩展）
      strategy: "jwt" as const,
      maxAge: 60 * 60 * 24 * 7, // 7 天
    },
    pages: {
      // 默认登录页（Web 端使用，由 apps/web 实现）
      signIn: "/auth/signin",
    },
    providers: [
      Credentials({
        name: "credentials",
        credentials: {
          email: { label: "邮箱", type: "email" },
          password: { label: "密码", type: "password" },
        },
        async authorize(credentials): Promise<ExtendedUser | null> {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const email = String(credentials.email);
          const password = String(credentials.password);

          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user || !user.password) {
            // 故意不区分"用户不存在"与"密码错误"，防止枚举攻击
            return null;
          }

          if (user.status !== "active") {
            return null;
          }

          const ok = await verifyPassword(password, user.password);
          if (!ok) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name ?? undefined,
            role: user.role,
          };
        },
      }),
    ],
    callbacks: {
      /**
       * JWT 回调：登录时注入 user.id / user.role 到 token
       */
      async jwt({ token, user }) {
        if (user) {
          const ext = user as ExtendedUser;
          token.userId = ext.id;
          token.role = ext.role ?? "user";
        }
        return token;
      },
      /**
       * Session 回调：把 token 中的 userId / role 暴露给客户端
       */
      async session({ session, token }) {
        if (session.user) {
          (session.user as ExtendedUser).id = token.userId as string;
          (session.user as ExtendedUser).role = token.role as string;
        }
        return session;
      },
    },
    secret: process.env.NEXTAUTH_SECRET,
  };
}

/**
 * 创建 NextAuth handler（供 Next.js API Route 使用）
 *
 * 注意：在 Fastify 中我们不直接挂载 NextAuth handler，
 * 仅复用其配置（共享 JWT secret）。LynxKit 桌面 / 移动端
 * 走 tRPC auth.login procedure 自行签发 JWT（共享 secret）。
 */
export function createNextAuth(prisma: PrismaClient) {
  const config = createAuthConfig(prisma);
  return NextAuth(config);
}
