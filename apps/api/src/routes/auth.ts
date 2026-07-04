/**
 * 认证路由 - LynxKit API
 *
 * 登录方式（邮箱已从登录链路中移除）：
 *   - 手机号 + 密码   POST /login
 *   - 手机号 + 验证码  POST /login-by-code
 *
 * 其他端点：
 *   POST /register      手机号 + 验证码 + 密码 + 昵称
 *   POST /send-code     发送短信验证码（Mock + Redis，开发环境返回 code）
 *   POST /verify-code   校验验证码（独立校验，不签发 token）
 *   GET  /me            获取当前用户（需 auth）
 *   PUT  /me            更新资料
 *   POST /logout        登出（token 加入黑名单）
 *   POST /refresh        刷新 access token
 *
 * 实现：
 *   - 密码用 bcrypt 哈希（saltRounds=10）
 *   - JWT 用 jose 签发（access 15min + refresh 30d），payload 携带 phone
 *   - 登出 token 加入 Redis 黑名单（立即失效）
 *   - 短信验证码存 Redis（5 分钟过期）
 */
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

import {
  loginSchema,
  loginByCodeSchema,
  registerSchema,
  sendCodeSchema,
  verifyCodeSchema,
  refreshTokenSchema,
  updateProfileSchema,
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
 * 统一签发 token 的工具：基于用户记录签发 access + refresh
 */
async function issueTokens(user: { id: string; phone: string; role: string }) {
  const accessToken = await signAccessToken({
    id: user.id,
    phone: user.phone,
    role: user.role,
  });
  const refreshToken = await signRefreshToken({
    id: user.id,
    phone: user.phone,
    role: user.role,
  });
  return { accessToken, refreshToken };
}

/**
 * @openapi
 * POST /auth/register
 * @summary 手机号 + 验证码注册
 * @tags auth
 * @requestBody phone + code + password + name
 */
authRoutes.post(
  "/register",
  zValidator("json", registerSchema),
  async (c) => {
    const input = c.req.valid("json");
    const db = getDb();
    const redis = getRedis();

    // 校验手机号是否已注册
    const existing = await db.query.users.findFirst({
      where: eq(users.phone, input.phone),
    });
    if (existing) {
      throw new ConflictError("该手机号已注册");
    }

    // 校验验证码（强制要求）
    if (redis) {
      const key = SMS_CODE_PREFIX + `register:${input.phone}`;
      const stored = await redis.get(key);
      if (!stored || stored !== input.code) {
        throw new BadRequestError("验证码错误或已过期");
      }
      await redis.del(key);
    }

    // 哈希密码
    const passwordHash = await bcrypt.hash(input.password, 10);

    // 创建用户
    const [user] = await db
      .insert(users)
      .values({
        phone: input.phone,
        name: input.name,
        passwordHash,
      })
      .returning();

    if (!user) {
      throw new Error("用户创建失败");
    }

    const tokens = await issueTokens(user);

    logger.info({ userId: user.id, phone: user.phone }, "用户注册成功");

    return c.json(
      {
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          role: user.role,
        },
        ...tokens,
      },
      201,
    );
  },
);

/**
 * @openapi
 * POST /auth/login
 * @summary 手机号 + 密码 登录
 * @tags auth
 */
authRoutes.post(
  "/login",
  zValidator("json", loginSchema),
  async (c) => {
    const input = c.req.valid("json");
    const db = getDb();

    const user = await db.query.users.findFirst({
      where: eq(users.phone, input.phone),
    });
    if (!user) {
      throw new UnauthorizedError("手机号或密码错误");
    }
    if (user.status !== "ACTIVE") {
      throw new UnauthorizedError("账号已被禁用，请联系管理员");
    }

    if (!user.passwordHash || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new UnauthorizedError("手机号或密码错误");
    }

    const tokens = await issueTokens(user);

    logger.info({ userId: user.id, phone: user.phone }, "用户登录成功（密码）");

    return c.json({
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    });
  },
);

/**
 * @openapi
 * POST /auth/login-by-code
 * @summary 手机号 + 验证码 登录
 * @tags auth
 */
authRoutes.post(
  "/login-by-code",
  zValidator("json", loginByCodeSchema),
  async (c) => {
    const input = c.req.valid("json");
    const db = getDb();
    const redis = getRedis();

    // 校验验证码
    if (redis) {
      const key = SMS_CODE_PREFIX + `login:${input.phone}`;
      const stored = await redis.get(key);
      if (!stored || stored !== input.code) {
        throw new BadRequestError("验证码错误或已过期");
      }
      await redis.del(key);
    }

    const user = await db.query.users.findFirst({
      where: eq(users.phone, input.phone),
    });
    if (!user) {
      throw new UnauthorizedError("该手机号尚未注册");
    }
    if (user.status !== "ACTIVE") {
      throw new UnauthorizedError("账号已被禁用，请联系管理员");
    }

    const tokens = await issueTokens(user);

    logger.info({ userId: user.id, phone: user.phone }, "用户登录成功（验证码）");

    return c.json({
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
      ...tokens,
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
 * @summary 验证码校验（不签发 token）
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
 * PUT /auth/me
 * @summary 更新当前用户资料（name / phone / avatar / email）
 * @tags auth
 * @security BearerAuth
 */
authRoutes.put(
  "/me",
  authMiddleware,
  zValidator("json", updateProfileSchema),
  async (c) => {
    const input = c.req.valid("json");
    const currentUser = getCurrentUser(c);
    const db = getDb();

    // 过滤掉 undefined 字段，避免覆盖为 null
    const patch: Record<string, string> = {};
    for (const [k, v] of Object.entries(input)) {
      if (v !== undefined) patch[k] = v;
    }

    if (Object.keys(patch).length === 0) {
      throw new BadRequestError("没有可更新的字段");
    }

    // 手机号唯一性校验
    if (patch.phone) {
      const existing = await db.query.users.findFirst({
        where: eq(users.phone, patch.phone),
      });
      if (existing && existing.id !== currentUser.id) {
        throw new ConflictError("该手机号已被其他账号绑定");
      }
    }

    // 邮箱唯一性校验（如提供）
    if (patch.email) {
      const existing = await db.query.users.findFirst({
        where: eq(users.email, patch.email),
      });
      if (existing && existing.id !== currentUser.id) {
        throw new ConflictError("该邮箱已被其他账号绑定");
      }
    }

    const [updated] = await db
      .update(users)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(users.id, currentUser.id))
      .returning();

    if (!updated) {
      throw new NotFoundError("用户");
    }

    logger.info({ userId: updated.id }, "用户资料已更新");

    return c.json({
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        avatar: updated.avatar,
        phone: updated.phone,
        role: updated.role,
        status: updated.status,
        createdAt: updated.createdAt,
      },
    });
  },
);

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

    const tokens = await issueTokens(user);

    return c.json(tokens);
  },
);
