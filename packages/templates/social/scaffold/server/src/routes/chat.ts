import { Hono } from "hono";
import { createNodeWebSocket } from "@hono/node-ws";
import { eq, desc } from "drizzle-orm";
import { getCookie } from "hono/cookie";
import { db } from "../lib/db";
import { conversations, messages } from "../../schema";
import { sentiment } from "../lib/ai";

/**
 * 聊天路由 /chat
 * - GET  /chat/conversations       会话列表
 * - GET  /chat/messages?peerId=     历史消息
 * - WS   /ws?conversationId=...     实时消息（由 attachWebSocket 注入）
 *
 * WebSocket 简化版：
 *   client -> server: { type, content, peerId }
 *   server -> client: Message
 *
 * 9 层 Agent 会接入会话创建、未读数、ACK 等逻辑。
 */
export const chatRoutes = new Hono();

function currentUser(c: any): string | null {
  return getCookie(c, "lynx_session") ?? null;
}

chatRoutes.get("/conversations", async (c) => {
  const me = currentUser(c);
  if (!me) return c.json({ error: "unauthorized" }, 401);
  let list: any[] = [];
  try {
    list = await (db as any)
      .select()
      .from(conversations)
      .orderBy(desc(conversations.lastMessageAt))
      .limit(50);
  } catch (e) {
    console.warn("[chat/conversations] db skipped:", (e as Error).message);
  }
  return c.json({ conversations: list });
});

chatRoutes.get("/messages", async (c) => {
  const me = currentUser(c);
  if (!me) return c.json({ error: "unauthorized" }, 401);
  const peerId = c.req.query("peerId");
  let list: any[] = [];
  try {
    list = await (db as any)
      .select()
      .from(messages)
      .where(eq(messages.conversationId, `${peerId}`))
      .orderBy(desc(messages.createdAt))
      .limit(50);
  } catch (e) {
    console.warn("[chat/messages] db skipped:", (e as Error).message);
  }
  return c.json({ messages: list });
});

/**
 * WebSocket 装配
 * - 由 index.ts 调用 attachWebSocket(upgradeWebSocket)
 * - 维护 conversationId -> Set<WebSocket> 的房间映射
 */
let _upgrade: any = null;
const rooms = new Map<string, Set<WebSocket>>();

export function attachWebSocket(upgradeWebSocket: any) {
  _upgrade = upgradeWebSocket;
  chatRoutes.get(
    "/ws",
    upgradeWebSocket((c: any) => {
      const conversationId = c.req.query("conversationId") ?? "default";
      return {
        onOpen(evt: any, ws: WebSocket) {
          const set = rooms.get(conversationId) ?? new Set<WebSocket>();
          set.add(ws);
          rooms.set(conversationId, set);
        },
        async onMessage(evt: any, ws: WebSocket) {
          const raw = evt.data?.toString?.() ?? String(evt.data);
          let payload: any;
          try {
            payload = JSON.parse(raw);
          } catch {
            payload = { type: "text", content: raw };
          }
          const senderId = getCookie(c, "lynx_session") ?? "anon";
          // 情感分析（异步，不阻塞回包）
          let senti = "neutral";
          try {
            senti = await sentiment(payload.content ?? "");
          } catch (e) {
            console.warn("[ws] sentiment skipped:", (e as Error).message);
          }

          const msg = {
            id: crypto.randomUUID(),
            conversationId,
            senderId,
            content: payload.content,
            type: payload.type ?? "text",
            sentiment: senti,
            aiGenerated: !!payload.aiGenerated,
            createdAt: new Date().toISOString(),
          };

          // 落库
          try {
            await (db as any).insert(messages).values(msg);
          } catch (e) {
            console.warn("[ws] db insert skipped:", (e as Error).message);
          }

          // 广播
          const set = rooms.get(conversationId);
          if (set) {
            for (const peer of set) {
              if (peer.readyState === peer.OPEN) peer.send(JSON.stringify(msg));
            }
          }
        },
        onClose(evt: any, ws: WebSocket) {
          for (const [id, set] of rooms) {
            set.delete(ws);
            if (set.size === 0) rooms.delete(id);
          }
        },
      };
    })
  );
}
