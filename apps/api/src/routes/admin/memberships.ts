/**
 * 管理后台 - 会员管理路由
 *
 * 端点：
 *   GET  /admin/memberships/plans                所有档位（含禁用）
 *   GET  /admin/memberships                       用户会员列表（分页+搜索）
 *   POST /admin/memberships/grant                 手动开通/续费会员
 *   POST /admin/memberships/scoin/adjust          调整 S 币余额
 *   GET  /admin/memberships/scoin/transactions    全平台 S 币流水
 */
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, desc, and, ilike, sql, count } from "drizzle-orm";

import {
  users,
  membershipPlans,
  userMemberships,
  sCoinBalances,
  sCoinTransactions,
} from "@lynxkit/db";

import { getDb } from "../../lib/db.js";
import { logger } from "../../lib/logger.js";
import { getCurrentUser } from "../../middleware/auth.js";
import { BadRequestError, NotFoundError } from "../../middleware/error.js";
import { paginationSchema, grantSCoinInternal } from "./_shared.js";

export const membershipsAdminRoutes = new Hono();

/**
 * 手动开通/续费会员 schema
 */
const grantMembershipSchema = z.object({
  userId: z.string().uuid(),
  tier: z.enum(["FREE", "LITE", "PRO", "MAX"]),
  durationMonths: z.number().int().min(1).max(36),
  source: z.enum(["MANUAL", "GIFT", "TRIAL"]).default("MANUAL"),
  note: z.string().max(500).optional(),
});

/**
 * 调整 S 币余额 schema
 */
const adjustSCoinSchema = z.object({
  userId: z.string().uuid(),
  delta: z.number().int().refine((n) => n !== 0, "delta 不能为 0"),
  note: z.string().max(500).optional(),
});

/**
 * GET /admin/memberships/plans
 * 获取所有会员档位配置（含禁用的）
 */
membershipsAdminRoutes.get("/memberships/plans", async (c) => {
  const db = getDb();
  const plans = await db
    .select()
    .from(membershipPlans)
    .orderBy(membershipPlans.sortOrder);

  return c.json({ list: plans });
});

/**
 * GET /admin/memberships
 * 用户会员管理列表（分页 + 搜索）
 * 返回每个用户的当前会员状态 + S 币余额
 */
membershipsAdminRoutes.get(
  "/memberships",
  zValidator("query", paginationSchema),
  async (c) => {
    const db = getDb();
    const { page, pageSize, search } = c.req.valid("query");
    const offset = (page - 1) * pageSize;

    const whereCondition = search
      ? ilike(users.phone, `%${search}%`)
      : sql`TRUE`;

    const userList = await db
      .select({
        id: users.id,
        phone: users.phone,
        name: users.name,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(whereCondition)
      .orderBy(desc(users.createdAt))
      .limit(pageSize)
      .offset(offset);

    const totalRows = await db
      .select({ count: count() })
      .from(users)
      .where(whereCondition);

    // 并行查询每个用户的会员状态 + S 币余额
    const enriched = await Promise.all(
      userList.map(async (u) => {
        const [membership, balance] = await Promise.all([
          db
            .select()
            .from(userMemberships)
            .where(
              and(
                eq(userMemberships.userId, u.id),
                eq(userMemberships.status, "ACTIVE"),
              ),
            )
            .orderBy(desc(userMemberships.createdAt))
            .limit(1)
            .then((rows) => rows[0] ?? null),
          db
            .select()
            .from(sCoinBalances)
            .where(eq(sCoinBalances.userId, u.id))
            .limit(1)
            .then((rows) => rows[0] ?? null),
        ]);
        return {
          ...u,
          membership: membership
            ? {
                tier: membership.tier,
                status: membership.status,
                source: membership.source,
                startedAt: membership.startedAt,
                expiresAt: membership.expiresAt,
              }
            : null,
          scoinBalance: balance?.balance ?? 0,
        };
      }),
    );

    return c.json({
      list: enriched,
      total: totalRows[0]?.count ?? 0,
      page,
      pageSize,
    });
  },
);

/**
 * POST /admin/memberships/grant
 * 手动开通/续费会员
 * 1. 将用户当前 ACTIVE 会员标记为 CANCELED
 * 2. 新增一条 ACTIVE 会员记录，expiresAt = NOW + durationMonths
 * 3. 如果是付费档位，按月数赠送 S 币（monthlySCoinGrant × durationMonths）
 */
membershipsAdminRoutes.post(
  "/memberships/grant",
  zValidator("json", grantMembershipSchema),
  async (c) => {
    const db = getDb();
    const operator = getCurrentUser(c);
    const { userId, tier, durationMonths, source, note } = c.req.valid("json");

    // 1. 校验用户存在
    const targetUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then((rows) => rows[0]);
    if (!targetUser) {
      throw new NotFoundError("目标用户不存在");
    }

    // 2. 校验档位存在
    const plan = await db
      .select()
      .from(membershipPlans)
      .where(eq(membershipPlans.tier, tier))
      .limit(1)
      .then((rows) => rows[0]);
    if (!plan) {
      throw new BadRequestError(`档位 ${tier} 不存在`);
    }

    // 3. 取消当前 ACTIVE 会员
    await db
      .update(userMemberships)
      .set({ status: "CANCELED", updatedAt: new Date() })
      .where(
        and(
          eq(userMemberships.userId, userId),
          eq(userMemberships.status, "ACTIVE"),
        ),
      );

    // 4. 计算到期时间
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

    // 5. 插入新会员记录
    const [newMembership] = await db
      .insert(userMemberships)
      .values({
        userId,
        tier,
        status: "ACTIVE",
        source,
        durationMonths,
        startedAt: now,
        expiresAt: tier === "FREE" ? null : expiresAt,
        operatorId: operator.id,
        note: note ?? `后台手动开通 ${plan.name} × ${durationMonths} 月`,
      })
      .returning();

    if (!newMembership) {
      throw new Error("会员开通失败：数据库返回空");
    }

    // 6. 付费档位赠送 S 币
    let grantedSCoin = 0;
    if (tier !== "FREE" && plan.monthlySCoinGrant > 0) {
      grantedSCoin = plan.monthlySCoinGrant * durationMonths;
      await grantSCoinInternal(
        db,
        userId,
        grantedSCoin,
        "GRANT",
        operator.id,
        `开通 ${plan.name} 赠送 ${grantedSCoin} S 币`,
        "membership",
        newMembership.id,
      );
    }

    logger.info(
      {
        operatorId: operator.id,
        targetUserId: userId,
        tier,
        durationMonths,
        grantedSCoin,
        membershipId: newMembership.id,
      },
      "管理员手动开通会员",
    );

    return c.json({
      membership: {
        id: newMembership.id,
        tier: newMembership.tier,
        status: newMembership.status,
        startedAt: newMembership.startedAt,
        expiresAt: newMembership.expiresAt,
      },
      grantedSCoin,
    });
  },
);

/**
 * POST /admin/memberships/scoin/adjust
 * 手动调整 S 币余额（赠送/扣减）
 */
membershipsAdminRoutes.post(
  "/memberships/scoin/adjust",
  zValidator("json", adjustSCoinSchema),
  async (c) => {
    const db = getDb();
    const operator = getCurrentUser(c);
    const { userId, delta, note } = c.req.valid("json");

    const targetUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then((rows) => rows[0]);
    if (!targetUser) {
      throw new NotFoundError("目标用户不存在");
    }

    const txType = delta > 0 ? "GRANT" : "ADJUST";
    const finalNote =
      note ?? (delta > 0 ? `后台赠送 ${delta} S 币` : `后台扣减 ${Math.abs(delta)} S 币`);

    const result = await grantSCoinInternal(
      db,
      userId,
      delta,
      txType,
      operator.id,
      finalNote,
      "admin_adjust",
      null,
    );

    logger.info(
      {
        operatorId: operator.id,
        targetUserId: userId,
        delta,
        newBalance: result.balanceAfter,
      },
      "管理员调整 S 币余额",
    );

    return c.json({
      balance: result.balanceAfter,
      delta,
      transaction: {
        id: result.txId,
        type: txType,
        delta,
        balanceAfter: result.balanceAfter,
      },
    });
  },
);

/**
 * GET /admin/memberships/scoin/transactions
 * 全平台 S 币流水（分页 + 用户手机号搜索）
 */
membershipsAdminRoutes.get(
  "/memberships/scoin/transactions",
  zValidator("query", paginationSchema),
  async (c) => {
    const db = getDb();
    const { page, pageSize, search } = c.req.valid("query");
    const offset = (page - 1) * pageSize;

    const conditions = search
      ? ilike(users.phone, `%${search}%`)
      : sql`TRUE`;

    const rows = await db
      .select({
        txId: sCoinTransactions.id,
        userId: sCoinTransactions.userId,
        userPhone: users.phone,
        userName: users.name,
        type: sCoinTransactions.type,
        delta: sCoinTransactions.delta,
        balanceAfter: sCoinTransactions.balanceAfter,
        refType: sCoinTransactions.refType,
        refId: sCoinTransactions.refId,
        note: sCoinTransactions.note,
        createdAt: sCoinTransactions.createdAt,
      })
      .from(sCoinTransactions)
      .innerJoin(users, eq(sCoinTransactions.userId, users.id))
      .where(conditions)
      .orderBy(desc(sCoinTransactions.createdAt))
      .limit(pageSize)
      .offset(offset);

    const totalRows = await db
      .select({ count: count() })
      .from(sCoinTransactions)
      .innerJoin(users, eq(sCoinTransactions.userId, users.id))
      .where(conditions);

    return c.json({
      list: rows,
      total: totalRows[0]?.count ?? 0,
      page,
      pageSize,
    });
  },
);
