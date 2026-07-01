/**
 * JWT 工具
 *
 * 用于 tRPC context 鉴权：从 Fastify request 提取 Bearer token，
 * 验证后注入 user 信息到 ctx。
 *
 * 跨端鉴权由 NextAuth.js v5（JWT 模式）统一处理；
 * 本模块签发的 token 与 NextAuth token 共享 secret，
 * 但 LynxKit 桌面端 / 移动端可绕过 NextAuth 直接走 JWT 流程。
 */
import jwt from "jsonwebtoken";

import { JWT_CONFIG } from "@lynxkit/shared/constants";

import { logger } from "./logger.js";

/** JWT payload 结构 */
export interface JwtPayload {
  /** 用户 ID */
  userId: string;
  /** 用户邮箱 */
  email: string;
  /** 用户角色 */
  role: string;
  /** 签发时间（秒） */
  iat?: number;
  /** 过期时间（秒） */
  exp?: number;
}

/**
 * 获取 JWT secret（从环境变量读取）
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    logger.error("JWT_SECRET 环境变量未配置");
    throw new Error("JWT_SECRET 环境变量未配置，请检查 .env");
  }
  return secret;
}

/**
 * 签发 JWT token
 *
 * @param user 用户信息（包含 id / email / role）
 * @returns JWT token 字符串
 */
export function signToken(user: {
  id: string;
  email: string;
  role: string;
}): string {
  const secret = getJwtSecret();
  const expiresIn = process.env.JWT_EXPIRES_IN ?? JWT_CONFIG.expiresIn;

  const payload: Omit<JwtPayload, "iat" | "exp"> = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, secret, {
    algorithm: JWT_CONFIG.algorithm,
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience,
    expiresIn,
  } as jwt.SignOptions);
}

/**
 * 验证 JWT token
 *
 * @param token JWT token 字符串
 * @returns payload（含 userId / email / role）
 * @throws token 无效或过期时抛出
 */
export function verifyToken(token: string): JwtPayload {
  const secret = getJwtSecret();
  const payload = jwt.verify(token, secret, {
    algorithms: [JWT_CONFIG.algorithm],
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience,
  }) as JwtPayload;
  return payload;
}

/**
 * 从 Authorization header 中提取 Bearer token
 *
 * @param header Authorization header 值（如 "Bearer xxx.yyy.zzz"）
 * @returns token 或 null
 */
export function extractBearerToken(header?: string): string | null {
  if (!header) return null;
  const trimmed = header.trim();
  if (!trimmed.toLowerCase().startsWith("bearer ")) return null;
  return trimmed.slice(7).trim();
}
