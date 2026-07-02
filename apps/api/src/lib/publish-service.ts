/**
 * 上架服务 - LynxKit API
 *
 * 把构建会话发布为商店产品（store_products 记录）：
 *   1. 校验会话存在且属于当前用户
 *   2. 校验该会话未被重复发布（session_id 唯一约束）
 *   3. 插入 store_products，状态默认 PENDING_REVIEW（待审核）
 *
 * 由 POST /store/publish 路由调用。
 *
 * 设计要点：db 通过 deps 注入，便于单元测试时直接传 mock 对象。
 */
import { eq } from "drizzle-orm";
import { buildSessions, storeProducts, type Database } from "@lynxkit/db";

import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "../middleware/error.js";

/** 上架输入（与 api-client PublishStoreProductInput 对齐） */
export interface PublishInput {
  sessionId: string;
  userId: string;
  name: string;
  description: string;
  category: unknown;
  pricingType: unknown;
  price: number;
  tags?: string[];
  version?: string;
  demoUrl?: string;
  readme?: string;
  coverUrl?: string;
  repoUrl?: string;
  subscriptionMonths?: number;
}

/** 依赖（仅 db，便于测试注入） */
export interface PublishDeps {
  db: Database;
}

/** 上架结果 */
export interface PublishOutput {
  product: {
    id: string;
    status: string;
    [key: string]: unknown;
  };
}

/**
 * 把构建会话发布为商店产品。
 *
 * @throws NotFoundError 会话不存在
 * @throws ForbiddenError 会话不属于该用户
 * @throws ConflictError 该会话已发布过（session_id 唯一约束）
 */
export async function publishBuildToStore(
  input: PublishInput,
  deps: PublishDeps,
): Promise<PublishOutput> {
  const { db } = deps;

  // 1. 校验会话存在且属于该用户
  const session = await db.query.buildSessions.findFirst({
    where: eq(buildSessions.id, input.sessionId),
  });
  if (!session) {
    throw new NotFoundError("构建会话");
  }
  if (session.userId !== input.userId) {
    throw new ForbiddenError("无权发布该构建会话");
  }

  // 2. 校验未重复发布（session_id 唯一约束）
  const existing = await db.query.storeProducts.findFirst({
    where: eq(storeProducts.sessionId, input.sessionId),
  });
  if (existing) {
    throw new ConflictError("该构建会话已发布到商店");
  }

  // 3. 插入 store_products，状态默认 PENDING_REVIEW（待审核）
  const [product] = await db
    .insert(storeProducts)
    .values({
      sessionId: input.sessionId,
      creatorId: input.userId,
      name: input.name,
      description: input.description,
      category: input.category as never,
      pricingType: input.pricingType as never,
      price: input.price > 0 ? String(input.price) : null,
      monthlyPrice:
        input.subscriptionMonths && input.price > 0
          ? String(input.price)
          : null,
      status: "PENDING_REVIEW",
      version: input.version ?? "1.0.0",
      demoUrl: input.demoUrl ?? null,
      tags: input.tags ?? [],
    })
    .returning();

  if (!product) {
    throw new Error("上架失败：数据库插入未返回记录");
  }

  return {
    product: {
      id: product.id as string,
      status: product.status as string,
      ...((product as Record<string, unknown>) ?? {}),
    },
  };
}
