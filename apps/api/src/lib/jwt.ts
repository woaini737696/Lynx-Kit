/**
 * JWT 工具（基于 jose）- LynxKit API
 *
 * LynxKit 不使用 better-auth 的内置 session（cookie + 数据库会话），
 * 而是统一签发无状态 JWT，便于：
 *   - 跨端鉴权（Web / 桌面端 / 移动端共用同一 token）
 *   - SSE / WebSocket 长连接鉴权
 *   - 微服务间调用
 *
 * 配合 Redis 黑名单实现登出立即失效（refresh 时校验黑名单）。
 *
 * Token 类型：
 *   - access token：短期（15 分钟），放入 Authorization header
 *   - refresh token：长期（30 天），仅用于换取新 access token
 */
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

import { env } from "../env.js";

/** JWT payload 结构 */
export interface JwtPayload extends JWTPayload {
  /** 用户 ID */
  sub: string;
  /** 用户邮箱 */
  email: string;
  /** 用户角色 */
  role: string;
  /** token 类型：access | refresh */
  type: "access" | "refresh";
}

/** access token 有效期（秒） */
export const ACCESS_TOKEN_TTL_SEC = 60 * 15; // 15 分钟
/** refresh token 有效期（秒） */
export const REFRESH_TOKEN_TTL_SEC = 60 * 60 * 24 * 30; // 30 天

const encoder = new TextEncoder();

/**
 * 获取签名密钥（SecretKey 实例）
 */
function getSecretKey(): Uint8Array {
  return encoder.encode(env.BETTER_AUTH_SECRET);
}

/**
 * 签发 access token
 *
 * @param user 用户信息（id / email / role）
 * @returns JWT access token 字符串
 */
export async function signAccessToken(user: {
  id: string;
  email: string;
  role: string;
}): Promise<string> {
  return new SignJWT({
    email: user.email,
    role: user.role,
    type: "access",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.id)
    .setIssuedAt()
    .setIssuer("lynxkit-api")
    .setAudience("lynxkit-client")
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SEC}s`)
    .sign(getSecretKey());
}

/**
 * 签发 refresh token
 *
 * @param user 用户信息
 * @returns JWT refresh token 字符串
 */
export async function signRefreshToken(user: {
  id: string;
  email: string;
  role: string;
}): Promise<string> {
  return new SignJWT({
    email: user.email,
    role: user.role,
    type: "refresh",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.id)
    .setIssuedAt()
    .setIssuer("lynxkit-api")
    .setAudience("lynxkit-client")
    .setExpirationTime(`${REFRESH_TOKEN_TTL_SEC}s`)
    .sign(getSecretKey());
}

/**
 * 验证 JWT token
 *
 * @param token JWT token 字符串
 * @param expectedType 期望的 token 类型（access / refresh），不传则不校验
 * @returns 解析后的 payload
 * @throws token 无效 / 过期 / 类型不符时抛出
 */
export async function verifyToken(
  token: string,
  expectedType?: "access" | "refresh",
): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, getSecretKey(), {
    issuer: "lynxkit-api",
    audience: "lynxkit-client",
  });
  const typed = payload as JwtPayload;
  if (expectedType && typed.type !== expectedType) {
    throw new Error(`token 类型不符：期望 ${expectedType}，实际 ${typed.type}`);
  }
  return typed;
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

/**
 * 从 Refresh header 或自定义 header 中提取 refresh token
 *
 * @param header X-Refresh-Token header 值
 * @returns token 或 null
 */
export function extractRefreshToken(header?: string): string | null {
  if (!header) return null;
  const trimmed = header.trim();
  if (!trimmed) return null;
  return trimmed;
}
