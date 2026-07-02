import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";

import { authRoutes } from "./routes/auth";
import { matchRoutes } from "./routes/match";
import { chatRoutes, attachWebSocket } from "./routes/chat";
import { profileRoutes } from "./routes/profile";
import { aiRoutes } from "./routes/ai";

/**
 * Hono 入口
 * - 装配所有路由：auth / match / chat / profile / ai
 * - WebSocket 走 /ws，由 chat 模块处理实时消息
 *
 * {{API_BASE_URL}} 默认 http://localhost:8787
 */
const app = new Hono();
app.use("*", logger());
app.use("*", cors({ origin: "{{API_BASE_URL_WEB}}", credentials: true }));

// REST 路由
app.route("/auth", authRoutes);
app.route("/match", matchRoutes);
app.route("/chat", chatRoutes);
app.route("/profile", profileRoutes);
app.route("/ai", aiRoutes);

app.get("/health", (c) => c.json({ ok: true, ts: Date.now() }));

// WebSocket
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket(app);
attachWebSocket(upgradeWebSocket);

const port = Number(process.env.PORT ?? 8787);
serve(
  { fetch: app.fetch, port },
  (info) => {
    console.log(`[social] server running on http://localhost:${info.port}`);
  }
);

// 注入 WS 到 Node server
injectWebSocket();
