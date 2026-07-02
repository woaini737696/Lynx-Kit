import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { getCookie } from "hono/cookie";
import { db } from "../lib/db";
import { users } from "../../schema";

/**
 * 资料路由 /profile
 * - GET  /profile/me       当前用户资料
 * - GET  /profile/:id      指定用户资料
 * - PUT  /profile          更新资料（昵称/简介/兴趣/头像）
 *
 * 9 层 Agent 会扩展照片墙、兴趣图谱等。
 */
export const profileRoutes = new Hono();

function currentUser(c: any): string | null {
  return getCookie(c, "lynx_session") ?? null;
}

profileRoutes.get("/me", async (c) => {
  const me = currentUser(c);
  if (!me) return c.json({ error: "unauthorized" }, 401);
  let row: any = null;
  try {
    const rows: any[] = await (db as any)
      .select()
      .from(users)
      .where(eq(users.id, me))
      .limit(1);
    row = rows[0];
  } catch (e) {
    console.warn("[profile/me] db skipped:", (e as Error).message);
  }
  if (!row) return c.json({ error: "not_found" }, 404);
  return c.json(row);
});

profileRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  let row: any = null;
  try {
    const rows: any[] = await (db as any)
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    row = rows[0];
  } catch (e) {
    console.warn("[profile/:id] db skipped:", (e as Error).message);
  }
  if (!row) return c.json({ error: "not_found" }, 404);
  return c.json(row);
});

profileRoutes.put("/", async (c) => {
  const me = currentUser(c);
  if (!me) return c.json({ error: "unauthorized" }, 401);
  const body = await c.req.json();
  try {
    await (db as any).update(users).set(body).where(eq(users.id, me));
  } catch (e) {
    console.warn("[profile/update] db skipped:", (e as Error).message);
  }
  return c.json({ ok: true });
});
