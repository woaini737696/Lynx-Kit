/**
 * tRPC 初始化
 *
 * - ZodError 自动转换为 BAD_REQUEST
 * - protectedProcedure 强制要求登录
 * - publicProcedure 允许匿名访问
 */
import { initTRPC, TRPCError } from "@trpc/server";
import type { OpenApiMeta } from "@trpc/openapi";

import { ZodError } from "zod";

import type { Context } from "./context.js";

const t = initTRPC.context<Context>().meta<OpenApiMeta>().create({
  errorFormatter({ shape, error }) {
    // ZodError 详情透传给客户端（便于表单校验展示）
    const zodError =
      error.cause instanceof ZodError
        ? error.cause.flatten()
        : null;

    return {
      ...shape,
      data: {
        ...shape.data,
        // tRPC 默认就会把 ZodError 转为 BAD_REQUEST，这里仅追加 zodError 字段
        zodError,
      },
    };
  },
});

/**
 * 中间件：要求用户已登录
 */
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "请先登录",
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // 类型收窄为非空
    },
  });
});

/**
 * 公共 procedure（允许匿名访问）
 */
export const publicProcedure = t.procedure;

/**
 * 受保护 procedure（要求登录）
 */
export const protectedProcedure = t.procedure.use(isAuthed);

/**
 * tRPC router 工厂
 */
export const router = t.router;
