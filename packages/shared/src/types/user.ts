import { z } from "zod";

/**
 * 用户角色枚举
 */
export const UserRoleSchema = z.enum(["user", "admin", "super_admin"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

/**
 * 用户状态枚举
 */
export const UserStatusSchema = z.enum(["active", "suspended", "deleted"]);
export type UserStatus = z.infer<typeof UserStatusSchema>;

/**
 * 平台用户 Schema（与 Prisma User 模型对应）
 */
export const UserSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  name: z.string().nullable().optional(),
  avatar: z.string().url().nullable().optional(),
  phone: z.string().nullable().optional(),
  lynxAiId: z.string().nullable().optional(),
  role: UserRoleSchema.default("user"),
  status: UserStatusSchema.default("active"),
  deviceToken: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type User = z.infer<typeof UserSchema>;

/**
 * 创建用户输入
 */
export const CreateUserInputSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(8, "密码至少 8 位").max(64, "密码最多 64 位"),
  name: z.string().min(1).max(50).optional(),
});

export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

/**
 * 登录输入
 */
export const LoginInputSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(1, "请输入密码"),
});

export type LoginInput = z.infer<typeof LoginInputSchema>;

/**
 * 登录响应（含 JWT）
 */
export const LoginResponseSchema = z.object({
  user: UserSchema,
  token: z.string(),
  expiresIn: z.number(),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

/**
 * 用户资料更新输入
 */
export const UpdateUserInputSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  avatar: z.string().url().optional(),
  phone: z.string().optional(),
});

export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;
