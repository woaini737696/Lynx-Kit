import { Hono } from "hono";
import { z } from "zod";
import { setCookie } from "hono/cookie";
import { randomUUID } from "node:crypto";
import { db, schema } from "../lib/db";
import { users } from "../../schema";
import { embed } from "../lib/ai";

/**
 * 认证路由 /auth
 * - POST /auth/sms        发送短信验证码
 * - POST /auth/register   注册（手机号 + 昵称 + 兴趣）
 * - POST /auth/login      登录（校验验证码 → 下发 session cookie）
 * - POST /auth/logout     登出
 *
 * 默认 identity = 手机号（由 questions.user_identity 决定）。
 */
export const authRoutes = new Hono();

// 简易内存验证码缓存（9 层 Agent 会替换为 Redis）
const codeCache = new Map<string, string>();

const smsSchema = z.object({ phone: z.string() });
const registerSchema = z.object({
  phone: z.string(),
  nickname: z.string(),
  gender: z.string().optional(),
  interests: z.array(z.string()).default([]),
});
const loginSchema = z.object({ phone: z.string(), code: z.string() });

authRoutes.post("/sms", async (c) => {
  const { phone } = smsSchema.parse(await c.req.json());
  const code = String(Math.floor(100000 + Math.random() * 900000));
  codeCache.set(phone, code);
  // 模板下仅打印；9 层 Agent 接入真实短信通道
  console.log(`[sms] ${phone} -> ${code}`);
  return c.json({ ok: true });
});

authRoutes.post("/register", async (c) => {
  const body = registerSchema.parse(await c.req.json());
  const id = randomUUID();
  // 兴趣 → embedding（pgvector 用于后续匹配）
  const embedding = body.interests.length
    ? await embed(body.interests.join(" "))
    : [];

  // 注：模板下 db 操作可能因连接未配置而失败，9 层 Agent 会兜底
  try {
    await (db as any).insert(users).values({
      id,
      phone: body.phone,
      nickname: body.nickname,
      gender: body.gender ?? "other",
      interests: body.interests,
      embedding,
    });
  } catch (e) {
    console.warn("[auth/register] db skipped:", (e as Error).message);
  }

  setCookie(c, "lynx_session", id, {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return c.json({ id, nickname: body.nickname });
});

authRoutes.post("/login", async (c) => {
  const { phone, code } = loginSchema.parse(await c.req.json());
  if (codeCache.get(phone) !== code) {
    return c.json({ error: "invalid_code" }, 401);
  }
  codeCache.delete(phone);

  let userId = randomUUID();
  try {
    const rows: any[] = await (db as any)
      .select()
      .from(users)
      .where((schema as any).eq?.(users.phone, phone));
    if (rows[0]) userId = rows[0].id;
  } catch (e) {
    console.warn("[auth/login] db skipped:", (e as Error).message);
  }

  setCookie(c, "lynx_session", userId, {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return c.json({ id: userId });
});

authRoutes.post("/logout", (c) => {
  setCookie(c, "lynx_session", "", { path: "/", maxAge: 0 });
  return c.json({ ok: true });
});
