/**
 * OpenAPI 规范生成（trpc-openapi）
 *
 * 通过 @trpc/openapi 从 appRouter 自动生成 OpenAPI 3.0 spec，
 * 供 Flutter 客户端代码生成（openapi-generator）使用。
 *
 * 访问端点：GET /openapi.json
 */
import { generateOpenApiDocument } from "@trpc/openapi";

import { appRouter } from "./routers/index.js";

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: "LynxKit API",
  version: "0.1.0",
  description:
    "LynxKit 后端 API（自动生成自 tRPC router）。\n\n供 Flutter 桌面端、移动端、Next.js Web 端三端共享调用。",
  baseUrl: process.env.NEXTAUTH_URL ?? "http://localhost:4000",
  docsUrl: "https://github.com/lynxkit/lynxkit",
  tags: [
    "auth",
    "server",
    "project",
    "template",
    "deploy",
  ],
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      description:
        "JWT token，登录后从 auth.login 返回。在 Authorization header 中携带：Bearer <token>",
    },
  },
});
