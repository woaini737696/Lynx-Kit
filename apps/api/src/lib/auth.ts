/**
 * Better Auth 实例配置 - LynxKit API
 *
 * LynxKit 简化认证流程：不使用 better-auth 的内置 session（cookie + DB 会话），
 * 而是统一用 jose 签发无状态 JWT（见 lib/jwt.ts）。
 *
 * better-auth 在此仅作为：
 *   - 邮箱/密码哈希与校验的辅助工具
 *   - 未来扩展 OAuth（GitHub / Google）时的接入点
 *
 * 真正的认证路由逻辑在 routes/auth.ts 中，使用 bcrypt + jose 实现。
 */
import { betterAuth } from "better-auth";

import { env } from "../env.js";

/**
 * Better Auth 实例（基础邮箱密码配置）
 *
 * 注意：由于 LynxKit 使用无状态 JWT，此处不启用 session 数据库存储，
 * 仅保留 better-auth 的配置能力，便于未来扩展。
 */
export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  // 邮箱密码插件由 routes/auth.ts 自行用 bcrypt 实现，此处保持最小配置
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
  },
  // 不使用 better-auth 的 session 机制（改用 jose JWT）
  session: {
    cookieCache: undefined,
  },
});

/**
 * Better Auth 类型（用于路由中可能需要的类型推断）
 */
export type Auth = typeof auth;
