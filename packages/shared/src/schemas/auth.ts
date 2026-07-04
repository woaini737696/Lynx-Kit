/**
 * 登录 / 注册 / 手机验证码 Zod schema - LynxKit v1.0
 *
 * 认证方式：
 *   - 手机号 + 密码
 *   - 手机号 + 验证码
 *
 * 邮箱已从登录链路中移除（仅作为可选联系方式保留在用户表）。
 */

import { z } from "zod";

/**
 * 邮箱（可选联系方式，不再用于登录）
 */
export const emailSchema = z.string().email("邮箱格式错误").optional();

/**
 * 密码：至少 8 位，需包含数字（不强制大写，便于国内用户使用）
 */
export const passwordSchema = z
  .string()
  .min(8, "密码至少 8 位")
  .regex(/[0-9]/, "需至少一个数字");

/**
 * 中国大陆手机号
 */
export const phoneSchema = z.string().regex(/^1[3-9]\d{9}$/, "手机号格式错误");

/**
 * 短信验证码（6 位数字）
 */
export const smsCodeSchema = z.string().length(6, "验证码为 6 位数字").regex(/^\d{6}$/, "验证码必须为数字");

/**
 * 手机号 + 密码 登录
 */
export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "请输入密码"),
});

/**
 * 手机号 + 验证码 登录
 */
export const loginByCodeSchema = z.object({
  phone: phoneSchema,
  code: smsCodeSchema,
});

/**
 * 注册：手机号 + 验证码 + 密码 + 昵称
 */
export const registerSchema = z.object({
  phone: phoneSchema,
  code: smsCodeSchema,
  password: passwordSchema,
  name: z.string().min(2, "昵称至少 2 位").max(50, "昵称最多 50 位"),
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
 * 更新个人资料（name / phone / avatar / email）
 */
export const updateProfileSchema = z.object({
  name: z.string().min(2, "昵称至少 2 位").max(50, "昵称最多 50 位").optional(),
  phone: phoneSchema.optional(),
  avatar: z.string().url("头像必须是有效 URL").optional(),
  email: z.string().email("邮箱格式错误").optional(),
});
