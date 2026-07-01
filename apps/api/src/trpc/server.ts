/**
 * Fastify 服务器组装
 *
 * 把所有插件（cors / cookie / jwt）和路由（tRPC / OpenAPI / health）
 * 注册到 Fastify 实例上，并返回可启动的 server。
 *
 * 抽离为函数便于：
 *   - 测试时创建独立实例
 *   - 集成到 Next.js 自定义 server 时复用
 */
import Fastify, {
  type FastifyInstance,
  type FastifyRequest,
  type FastifyReply,
} from "fastify";

import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import jwtPlugin from "@fastify/jwt";

import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";

import { appRouter } from "./routers/index.js";
import { createContext } from "./context.js";
import { openApiDocument } from "./openapi.js";

import { logger } from "../lib/logger.js";

export interface CreateServerOptions {
  /** 监听端口 */
  port?: number;
  /** 监听主机 */
  host?: string;
  /** 是否在 logger 中开启 pretty（开发模式） */
  loggerPretty?: boolean;
}

/**
 * 创建 Fastify 服务器实例（不启动监听）
 *
 * 注意：返回的实例尚未 listen，调用方需自行调用 .listen()
 */
export async function createFastifyServer(
  options: CreateServerOptions = {}
): Promise<FastifyInstance> {
  const port = options.port ?? Number(process.env.API_PORT) ?? 4000;
  const host = options.host ?? process.env.API_HOST ?? "0.0.0.0";

  const server = Fastify({
    logger: false, // 使用自定义 pino logger，禁用 Fastify 内置
    disableRequestLogging: false,
    trustProxy: true,
    bodyLimit: 5 * 1024 * 1024, // 5MB
  });

  // CORS：允许 Web 端 + Capacitor / app:// tailer 协议
  await server.register(cors, {
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      // Capacitor / Tauri 等桌面端 / 移动端 hybrid 协议
      "capacitor://localhost",
      "http://localhost",
      "tauri://localhost",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Authorization",
      "Content-Type",
      "trpc-accept",
      "x-trpc-source",
    ],
  });

  // Cookie（NextAuth session cookie 需要）
  await server.register(cookie, {});

  // JWT 插件（用于 Fastify 路由级别的鉴权，tRPC 走自己的 ctx）
  await server.register(jwtPlugin, {
    secret: process.env.JWT_SECRET ?? "dev_only_jwt_secret_replace_in_prod_32b",
    sign: {
      issuer: "lynxkit",
      audience: "lynxkit-users",
      expiresIn: "7d",
    },
  });

  // tRPC 插件：挂载到 /trpc
  await server.register(fastifyTRPCPlugin, {
    prefix: "/trpc",
    trpcOptions: {
      router: appRouter,
      createContext: (opts: {
        req: FastifyRequest;
        res: FastifyReply;
      }) => createContext({ req: opts.req }),
      onError({ path, error }) {
        logger.error({ path, err: error }, "tRPC error");
      },
    },
  });

  // OpenAPI spec 端点
  server.get("/openapi.json", async (_req, reply) => {
    return reply.send(openApiDocument);
  });

  // 健康检查
  server.get("/health", async (_req, reply) => {
    return reply.send({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // 根路径欢迎
  server.get("/", async (_req, reply) => {
    return reply.send({
      name: "LynxKit API",
      version: "0.1.0",
      docs: "/openapi.json",
      health: "/health",
      trpc: "/trpc",
    });
  });

  // 把端口挂到 server 上便于外部访问
  server.decorate("port", port);
  server.decorate("host", host);

  return server;
}

/**
 * 启动 Fastify 服务器
 *
 * 注册所有插件后调用 listen，并在退出时优雅关闭。
 */
export async function startServer(options: CreateServerOptions = {}): Promise<FastifyInstance> {
  const server = await createFastifyServer(options);
  const port = (server as unknown as { port: number }).port;
  const host = (server as unknown as { host: string }).host;

  // 优雅关闭
  const shutdown = async (signal: string) => {
    logger.info({ signal }, "收到退出信号，开始优雅关闭...");
    try {
      await server.close();
      logger.info("Fastify 已关闭");
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "关闭时出错");
      process.exit(1);
    }
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  try {
    await server.listen({ port, host });
    logger.info(
      { port, host, url: `http://${host}:${port}` },
      "🚀 LynxKit API 已启动"
    );
    logger.info(
      { docs: `http://localhost:${port}/openapi.json` },
      "📖 OpenAPI 文档地址"
    );
  } catch (err) {
    logger.error({ err }, "Fastify 启动失败");
    throw err;
  }

  return server;
}
