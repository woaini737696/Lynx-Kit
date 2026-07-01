/**
 * Auth Router
 *
 * 端点：
 *   - register: 注册用户（bcrypt 哈希密码，返回 LoginResponse）
 *   - login: 邮箱 + 密码登录，签发 JWT
 *   - me: 获取当前登录用户信息
 *   - updateProfile: 更新当前用户资料
 */
import { TRPCError } from "@trpc/server";

import {
  CreateUserInputSchema,
  LoginInputSchema,
  LoginResponseSchema,
  UpdateUserInputSchema,
  type LoginResponse,
  type User,
} from "@lynxkit/shared";

import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { signToken } from "../../lib/jwt.js";
import { hashPassword, verifyPassword } from "../../auth/password.js";
import { logger } from "../../lib/logger.js";

/**
 * Prisma User → API 响应的 User 对象（去除敏感字段，ISO 化时间）
 */
function toUserDto(user: {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  phone: string | null;
  lynxAiId: string | null;
  role: string;
  status: string;
  deviceToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    phone: user.phone,
    lynxAiId: user.lynxAiId,
    role: user.role as User["role"],
    status: user.status as User["status"],
    deviceToken: user.deviceToken,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export const authRouter = router({
  /**
   * 注册新用户
   *
   * - 邮箱必须唯一（违反时返回 CONFLICT）
   * - 密码使用 bcrypt 哈希存储
   * - 注册成功后自动签发 JWT（无需再次登录）
   */
  register: publicProcedure
    .input(CreateUserInputSchema)
    .mutation(async ({ input, ctx }) => {
      const existing = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "该邮箱已被注册",
        });
      }

      const passwordHash = await hashPassword(input.password);
      const user = await ctx.prisma.user.create({
        data: {
          email: input.email,
          password: passwordHash,
          name: input.name,
          role: "user",
          status: "active",
        },
      });

      logger.info({ userId: user.id, email: user.email }, "用户注册成功");

      const token = signToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      const response: LoginResponse = {
        user: toUserDto(user),
        token,
        expiresIn: 7 * 24 * 3600, // 7 天，单位秒
      };
      return LoginResponseSchema.parse(response);
    }),

  /**
   * 邮箱 + 密码登录
   *
   * - 校验密码哈希
   * - 校验账号状态为 active
   * - 签发 7 天有效期的 JWT
   */
  login: publicProcedure
    .input(LoginInputSchema)
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (!user || !user.password) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "邮箱或密码错误",
        });
      }

      if (user.status !== "active") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "账号已被停用，请联系管理员",
        });
      }

      const ok = await verifyPassword(input.password, user.password);
      if (!ok) {
        // 故意使用相同错误信息防止枚举攻击
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "邮箱或密码错误",
        });
      }

      logger.info({ userId: user.id, email: user.email }, "用户登录成功");

      const token = signToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      const response: LoginResponse = {
        user: toUserDto(user),
        token,
        expiresIn: 7 * 24 * 3600,
      };
      return LoginResponseSchema.parse(response);
    }),

  /**
   * 获取当前登录用户信息
   */
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
    });
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "用户不存在",
      });
    }
    return toUserDto(user);
  }),

  /**
   * 更新当前用户资料（name / avatar / phone）
   */
  updateProfile: protectedProcedure
    .input(UpdateUserInputSchema)
    .mutation(async ({ input, ctx }) => {
      const updated = await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.avatar !== undefined && { avatar: input.avatar }),
          ...(input.phone !== undefined && { phone: input.phone }),
        },
      });

      logger.info({ userId: updated.id }, "用户资料已更新");
      return toUserDto(updated);
    }),
});
