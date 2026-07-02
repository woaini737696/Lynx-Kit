import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { db } from "../lib/db";
import { icebreakers, users } from "../../schema";
import { eq } from "drizzle-orm";
import { chat } from "../lib/ai";

/**
 * AI 助手路由 /ai
 * - GET  /ai/icebreaker?peerId=...   生成破冰开场白（多条）
 * - POST /ai/topic                    话题推荐
 * - POST /ai/sentiment               情感分析（独立调用，区别于 ws 自动分析）
 *
 * 由 questions.ai_assistant 决定启用哪些子路由，9 层 Agent 会裁剪。
 */
export const aiRoutes = new Hono();

function currentUser(c: any): string | null {
  return getCookie(c, "lynx_session") ?? null;
}

aiRoutes.get("/icebreaker", async (c) => {
  const me = currentUser(c);
  if (!me) return c.json({ error: "unauthorized" }, 401);
  const peerId = c.req.query("peerId");
  if (!peerId) return c.json({ error: "missing peerId" }, 400);

  // 拉取双方资料用于破冰上下文
  let meProfile: any = null;
  let peerProfile: any = null;
  try {
    const meRows: any[] = await (db as any).select().from(users).where(eq(users.id, me)).limit(1);
    const peerRows: any[] = await (db as any).select().from(users).where(eq(users.id, peerId)).limit(1);
    meProfile = meRows[0];
    peerProfile = peerRows[0];
  } catch (e) {
    console.warn("[ai/icebreaker] db skipped:", (e as Error).message);
  }

  const suggestionsRaw = await chat(
    [
      {
        role: "system",
        content:
          "你是社交破冰助手。基于双方资料生成 3 条自然、不做作的开场白，每条不超过 30 字，输出 JSON 数组。",
      },
      {
        role: "user",
        content: JSON.stringify({
          me: { nickname: meProfile?.nickname, interests: meProfile?.interests },
          peer: {
            nickname: peerProfile?.nickname,
            interests: peerProfile?.interests,
            bio: peerProfile?.bio,
          },
        }),
      },
    ],
    { temperature: 0.9, maxTokens: 200 }
  );

  let suggestions: string[] = [];
  try {
    suggestions = JSON.parse(suggestionsRaw);
  } catch {
    suggestions = suggestionsRaw
      .split(/\n|•|-/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);
  }

  // 落库
  const conversationId = `${peerId}`;
  try {
    for (const s of suggestions) {
      await (db as any).insert(icebreakers).values({
        id: crypto.randomUUID(),
        conversationId,
        suggestion: s,
        used: false,
      });
    }
  } catch (e) {
    console.warn("[ai/icebreaker] db skipped:", (e as Error).message);
  }

  return c.json({ suggestions });
});

aiRoutes.post("/topic", async (c) => {
  const me = currentUser(c);
  if (!me) return c.json({ error: "unauthorized" }, 401);
  const { recentMessages = [] } = await c.req.json();
  const topic = await chat(
    [
      {
        role: "system",
        content:
          "基于最近聊天内容推荐 1 个可继续聊下去的话题，30 字以内，直接输出文字。",
      },
      { role: "user", content: JSON.stringify(recentMessages) },
    ],
    { temperature: 0.8, maxTokens: 60 }
  );
  return c.json({ topic });
});

aiRoutes.post("/sentiment", async (c) => {
  const { content } = await c.req.json();
  // 复用 ai.sentiment 简化版（不落库）
  const label = await chat(
    [
      {
        role: "system",
        content:
          "你是情感分析助手。只输出一个单词：positive / neutral / negative。",
      },
      { role: "user", content },
    ],
    { temperature: 0, maxTokens: 8 }
  );
  const t = label.trim().toLowerCase();
  const result = t.includes("positive")
    ? "positive"
    : t.includes("negative")
    ? "negative"
    : "neutral";
  return c.json({ sentiment: result });
});
