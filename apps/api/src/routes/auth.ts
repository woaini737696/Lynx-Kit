/**
 * 认证路由 - LynxKit API
 *
 * 端点：
 *   POST /register       邮箱+密码注册
 *   POST /login          邮箱密码登录
 *   POST /send-code      发送手机验证码
 *   POST /verify-code    验证码校验
 *   GET  /me             获取当前用户（需 auth）
 *   POST /logout          登出（token 加入黑名单）
 *   POST /refresh         刷新 access token
 *
 * 实现：
 *   - 密码用 bcrypt 哈希（saltRounds=10）
 *   - JWT 用 jose 签发（access 15min + refresh 30d）
 *   - 登出 token 加入 Redis 黑名单（立即失效）
 *   - 短信验证码存 Redis（5 分钟过期）
 *
 * Better Auth 实例配置在 lib/auth.ts，此处使用 jose 直接签发 JWT（简化）。
 */
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

import {
  loginSchema,
  registerSchema,
  sendCodeSchema,
  verifyCodeSchema,
  refreshTokenSchema,
} from "@lynxkit/shared";
import { users } from "@lynxkit/db";

import { getDb } from "../lib/db.js";
import { getRedis } from "../lib/redis.js";
import { logger } from "../lib/logger.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
  extractBearerToken,
  ACCESS_TOKEN_TTL_SEC,
} from "../lib/jwt.js";
import { authMiddleware, getCurrentUser, blacklistToken } from "../middleware/auth.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../middleware/error.js";

export const authRoutes = new Hono();

/**
 * 验证码 Redis key
 */
const SMS_CODE_PREFIX = "lynxkit:sms:code:";

/**
 * @openapi
 * POST /auth/register
 * @summary 邮箱密码注册
 * @tags auth
 * @requestBody email + password + name + phone?(+code)
 */
authRoutes.post(
  "/register",
  zValidator("json", registerSchema),
  async (c) => {
    const input = c.req.valid("json");
    const db = getDb();

    // 检查邮箱是否已注册
    const existing = await db.query.users.findFirst({
      where: eq(users.email, input.email),
    });
    if (existing) {
      throw new ConflictError("该邮箱已注册");
    }

    // 校验手机号验证码（如提供 phone）
    if (input.phone && input.code) {
      const redis = getRedis();
      if (redis) {
        const key = SMS_CODE_PREFIX + `register:${input.phone}`;
        const stored = await redis.get(key);
        if (stored !== input.code) {
          throw new BadRequestError("验证码错误或已过期");
        }
        await redis.del(key);
      }
    }

    // 哈希密码
    const passwordHash = await bcrypt.hash(input.password, 10);

    // 创建用户（密码哈希直接存数据库，MVP 阶段不依赖 Redis）
    const [user] = await db
      .insert(users)
      .values({
        email: input.email,
        name: input.name,
        phone: input.phone,
        passwordHash,
      })
      .returning();

    if (!user) {
      throw new Error("用户创建失败");
    }

    // 签发 JWT
    const accessToken = await signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = await signRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    logger.info({ userId: user.id, email: user.email }, "用户注册成功");

    return c.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
      201,
    );
  },
);

/**
 * @openapi
 * POST /auth/login
 * @summary 邮箱密码登录
 * @tags auth
 */
authRoutes.post(
  "/login",
  zValidator("json", loginSchema),
  async (c) => {
    const input = c.req.valid("json");
    const db = getDb();

    const user = await db.query.users.findFirst({
      where: eq(users.email, input.email),
    });
    if (!user) {
      throw new UnauthorizedError("邮箱或密码错误");
    }
    if (user.status !== "ACTIVE") {
      throw new UnauthorizedError("账号已被禁用，请联系管理员");
    }

    // 校验密码（直接从数据库读取，MVP 阶段不依赖 Redis）
    if (!user.passwordHash || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new UnauthorizedError("邮箱或密码错误");
    }

    const accessToken = await signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = await signRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    logger.info({ userId: user.id, email: user.email }, "用户登录成功");

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  },
);

/**
 * @openapi
 * POST /auth/send-code
 * @summary 发送手机验证码
 * @tags auth
 * @rateLimited 5次/分钟
 */
authRoutes.post(
  "/send-code",
  zValidator("json", sendCodeSchema),
  async (c) => {
    const input = c.req.valid("json");
    const redis = getRedis();

    // 生成 6 位验证码
    const code = nanoid(6).replace(/[^0-9]/g, "").padEnd(6, "0").slice(0, 6);

    if (redis) {
      const key = SMS_CODE_PREFIX + `${input.scene}:${input.phone}`;
      // 5 分钟过期
      await redis.set(key, code, "EX", 300);
    }

    // TODO: 接入真实短信网关（阿里云 / 腾讯云）
    // 当前仅记录日志（开发环境返回验证码便于联调）
    logger.info({ phone: input.phone, scene: input.scene, code }, "短信验证码已发送");

    const isDev = process.env.NODE_ENV === "development";
    return c.json({
      sent: true,
      ...(isDev ? { code } : {}),
      expiresInSec: 300,
    });
  },
);

/**
 * @openapi
 * POST /auth/verify-code
 * @summary 验证码校验
 * @tags auth
 */
authRoutes.post(
  "/verify-code",
  zValidator("json", verifyCodeSchema),
  async (c) => {
    const input = c.req.valid("json");
    const redis = getRedis();

    if (redis) {
      const key = SMS_CODE_PREFIX + `${input.scene}:${input.phone}`;
      const stored = await redis.get(key);
      if (!stored || stored !== input.code) {
        throw new BadRequestError("验证码错误或已过期");
      }
      await redis.del(key);
    }

    return c.json({ valid: true });
  },
);

/**
 * @openapi
 * GET /auth/me
 * @summary 获取当前登录用户
 * @tags auth
 * @security BearerAuth
 */
authRoutes.get("/me", authMiddleware, async (c) => {
  const user = getCurrentUser(c);
  const db = getDb();

  const fullUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });
  if (!fullUser) {
    throw new NotFoundError("用户");
  }

  return c.json({
    user: {
      id: fullUser.id,
      email: fullUser.email,
      name: fullUser.name,
      avatar: fullUser.avatar,
      phone: fullUser.phone,
      role: fullUser.role,
      status: fullUser.status,
      createdAt: fullUser.createdAt,
    },
  });
});

/**
 * @openapi
 * POST /auth/logout
 * @summary 登出（令牌加入黑名单）
 * @tags auth
 * @security BearerAuth
 */
authRoutes.post("/logout", authMiddleware, async (c) => {
  const authHeader = c.req.header("authorization");
  const token = extractBearerToken(authHeader);

  if (token) {
    // 将 token 加入黑名单，TTL 设为剩余有效期
    await blacklistToken(token, ACCESS_TOKEN_TTL_SEC);
  }

  logger.info({ userId: getCurrentUser(c).id }, "用户登出");
  return c.json({ loggedOut: true });
});

/**
 * @openapi
 * POST /auth/refresh
 * @summary 用 refresh token 换取新的 access token
 * @tags auth
 * @requestBody refreshToken
 */
authRoutes.post(
  "/refresh",
  zValidator("json", refreshTokenSchema),
  async (c) => {
    const { refreshToken } = c.req.valid("json");

    let payload;
    try {
      payload = await verifyToken(refreshToken, "refresh");
    } catch {
      throw new UnauthorizedError("refresh token 无效或已过期，请重新登录");
    }

    const db = getDb();
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.sub),
    });
    if (!user || user.status !== "ACTIVE") {
      throw new UnauthorizedError("用户不存在或已被禁用");
    }

    const newAccessToken = await signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    const newRefreshToken = await signRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return c.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  },
);
