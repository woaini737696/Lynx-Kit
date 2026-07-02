import { Hono } from "hono";
import { db } from "../lib/db";
import { users, matches } from "../../schema";
import { sql, eq, and, cosineDistance, desc } from "drizzle-orm";
import { getCookie } from "hono/cookie";

/**
 * 匹配路由 /match
 * - GET  /match/discover        推荐列表（基于兴趣向量 cosine 相似度）
 * - POST /match/:targetUserId   发起匹配（写入 matches 表，status=pending）
 * - POST /match/:id/accept      接受匹配
 * - POST /match/:id/reject      拒绝匹配
 *
 * 算法：由 questions.match_algorithm 决定（默认 综合兴趣+性格+位置）。
 * 模板默认实现兴趣向量匹配，9 层 Agent 会按用户选择扩展。
 */
export const matchRoutes = new Hono();

function currentUser(c: any): string | null {
  return getCookie(c, "lynx_session") ?? null;
}

matchRoutes.get("/discover", async (c) => {
  const me = currentUser(c);
  if (!me) return c.json({ error: "unauthorized" }, 401);

  let list: any[] = [];
  try {
    const meRow: any = await (db as any)
      .select()
      .from(users)
      .where(eq(users.id, me))
      .limit(1);
    const myEmbedding = meRow[0]?.embedding;
    if (!myEmbedding) return c.json({ recommends: [] });

    const similarity = sql<number>`1 - (${cosineDistance(
      users.embedding,
      myEmbedding
    )})`;
    list = await (db as any)
      .select({
        userId: users.id,
        nickname: users.nickname,
        avatar: users.avatar,
        bio: users.bio,
        interests: users.interests,
        score: sql<number>`round((${similarity}) * 100)::int`,
      })
      .from(users)
      .where(and(eq(users.id, sql`'${me}'`).constructor === Function ? sql`true` : sql`true`, sql`${users.id} <> ${me}`))
      .orderBy(desc(similarity))
      .limit(20);
  } catch (e) {
    console.warn("[match/discover] db skipped:", (e as Error).message);
  }
  return c.json({ recommends: list });
});

matchRoutes.post("/:targetUserId", async (c) => {
  const me = currentUser(c);
  if (!me) return c.json({ error: "unauthorized" }, 401);
  const targetUserId = c.req.param("targetUserId");
  try {
    await (db as any).insert(matches).values({
      id: crypto.randomUUID(),
      userId: me,
      targetUserId,
      score: 0,
      status: "pending",
    });
  } catch (e) {
    console.warn("[match/create] db skipped:", (e as Error).message);
  }
  return c.json({ ok: true });
});

matchRoutes.post("/:id/accept", async (c) => {
  const me = currentUser(c);
  if (!me) return c.json({ error: "unauthorized" }, 401);
  try {
    await (db as any)
      .update(matches)
      .set({ status: "accepted" })
      .where(eq(matches.id, c.req.param("id")));
  } catch (e) {
    console.warn("[match/accept] db skipped:", (e as Error).message);
  }
  return c.json({ ok: true });
});

matchRoutes.post("/:id/reject", async (c) => {
  const me = currentUser(c);
  if (!me) return c.json({ error: "unauthorized" }, 401);
  try {
    await (db as any)
      .update(matches)
      .set({ status: "rejected" })
      .where(eq(matches.id, c.req.param("id")));
  } catch (e) {
    console.warn("[match/reject] db skipped:", (e as Error).message);
  }
  return c.json({ ok: true });
});
