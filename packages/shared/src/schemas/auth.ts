/**
 * 登录 / 注册 / 手机验证码 Zod schema - LynxKit v1.0
 */

import { z } from "zod";

/**
 * 邮箱
 */
export const emailSchema = z.string().email("邮箱格式错误");

/**
 * 密码：至少 8 位，需包含大写字母与数字
 */
export const passwordSchema = z
  .string()
  .min(8, "密码至少 8 位")
  .regex(/[A-Z]/, "需大写字母")
  .regex(/[0-9]/, "需数字");

/**
 * 中国大陆手机号
 */
export const phoneSchema = z.string().regex(/^1[3-9]\d{9}$/, "手机号格式错误");

/**
 * 短信验证码（6 位数字）
 */
export const smsCodeSchema = z.string().length(6, "验证码为 6 位数字").regex(/^\d{6}$/, "验证码必须为数字");

/**
 * 登录
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string(),
});

/**
 * 注册
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(2, "昵称至少 2 位").max(50, "昵称最多 50 位"),
  phone: phoneSchema.optional(),
  code: z.string().length(6).optional(),
});

/**
 * 发送短信验证码
 */
export const sendCodeSchema = z.object({
  phone: phoneSchema,
  scene: z.enum(["register", "login", "reset"]),
});

/**
 * 校验短信验证码
 */
export const verifyCodeSchema = z.object({
  phone: phoneSchema,
  code: smsCodeSchema,
  scene: z.enum(["register", "login", "reset"]),
});

/**
 * 重置密码
 */
export const resetPasswordSchema = z.object({
  phone: phoneSchema,
  code: smsCodeSchema,
  newPassword: passwordSchema,
});

/**
 * 刷新 token
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "refreshToken 不能为空"),
});

/**
 * 更新个人资料（name / phone / avatar）
 */
export const updateProfileSchema = z.object({
  name: z.string().min(2, "昵称至少 2 位").max(50, "昵称最多 50 位").optional(),
  phone: phoneSchema.optional(),
  avatar: z.string().url("头像必须是有效 URL").optional(),
});
