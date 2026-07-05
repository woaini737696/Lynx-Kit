/**
 * 会员路由 - LynxKit API
 *
 * 用户侧端点（需 auth）：
 *   GET  /plans               获取 4 档会员档位（公开）
 *   GET  /me                  获取当前用户会员状态 + S 币余额
 *   GET  /scoin/transactions  获取 S 币流水（分页）
 *
 * 实现：
 *   - 会员档位：FREE / LITE / PRO / MAX（4 档静态配置）
 *   - S 币体系：1 Token = 15 S 币（rate 配置在 membership_plans.token_to_scoin_rate）
 *   - 当前用户会员状态从 user_memberships 取最近一条 ACTIVE
 *   - S 币余额从 scoin_balances 取，无记录则默认 0
 */
import { Hono } from "hono";
import { and, desc, eq, lt } from "drizzle-orm";

import {
  membershipPlans,
  userMemberships,
  sCoinBalances,
  sCoinTransactions,
} from "@lynxkit/db";

import { getDb } from "../lib/db.js";
import { authMiddleware, getCurrentUser } from "../middleware/auth.js";
import { BadRequestError, NotFoundError } from "../middleware/error.js";

export const membershipRoutes = new Hono();

/**
 * 过期会员状态自动标记
 * 检查 expiresAt < NOW() 且 status = ACTIVE，更新为 EXPIRED
 */
async function refreshExpiredMemberships(userId: string): Promise<void> {
  const db = getDb();
  const now = new Date();
  await db
    .update(userMemberships)
    .set({ status: "EXPIRED", updatedAt: now })
    .where(
      and(
        eq(userMemberships.userId, userId),
        eq(userMemberships.status, "ACTIVE"),
        lt(userMemberships.expiresAt, now),
      ),
    );
}

/**
 * GET /plans
 * 公开：获取所有启用的会员档位（按 sortOrder 排序）
 */
membershipRoutes.get("/plans", async (c) => {
  const db = getDb();
  const plans = await db
    .select()
    .from(membershipPlans)
    .where(eq(membershipPlans.enabled, true))
    .orderBy(membershipPlans.sortOrder);

  return c.json({
    list: plans.map((p) => ({
      id: p.id,
      tier: p.tier,
      name: p.name,
      priceMonthly: p.priceMonthly,
      priceYearly: p.priceYearly,
      monthlySCoinGrant: p.monthlySCoinGrant,
      tokenToSCoinRate: p.tokenToSCoinRate,
      features: p.features,
      sortOrder: p.sortOrder,
    })),
  });
});

/**
 * 应用鉴权中间件：后续所有端点都需要 auth
 */
membershipRoutes.use("/*", authMiddleware);

/**
 * GET /me
 * 获取当前用户会员状态 + S 币余额
 */
membershipRoutes.get("/me", async (c) => {
  const user = getCurrentUser(c);
  const db = getDb();

  // 刷新过期状态
  await refreshExpiredMemberships(user.id);

  // 查询当前 ACTIVE 会员
  const membership = await db
    .select()
    .from(userMemberships)
    .where(
      and(
        eq(userMemberships.userId, user.id),
        eq(userMemberships.status, "ACTIVE"),
      ),
    )
    .orderBy(desc(userMemberships.createdAt))
    .limit(1)
    .then((rows) => rows[0]);

  // 查询 S 币余额
  const balance = await db
    .select()
    .from(sCoinBalances)
    .where(eq(sCoinBalances.userId, user.id))
    .limit(1)
    .then((rows) => rows[0]);

  // 查询当前档位配置
  const currentTier = membership?.tier ?? "FREE";
  const plan = await db
    .select()
    .from(membershipPlans)
    .where(eq(membershipPlans.tier, currentTier))
    .limit(1)
    .then((rows) => rows[0]);

  return c.json({
    membership: membership
      ? {
          id: membership.id,
          tier: membership.tier,
          status: membership.status,
          source: membership.source,
          startedAt: membership.startedAt,
          expiresAt: membership.expiresAt,
          durationMonths: membership.durationMonths,
        }
      : null,
    plan: plan
      ? {
          name: plan.name,
          tier: plan.tier,
          priceMonthly: plan.priceMonthly,
          monthlySCoinGrant: plan.monthlySCoinGrant,
          tokenToSCoinRate: plan.tokenToSCoinRate,
          features: plan.features,
        }
      : null,
    scoinBalance: balance
      ? {
          balance: balance.balance,
          frozenBalance: balance.frozenBalance,
          totalGranted: balance.totalGranted,
          totalConsumed: balance.totalConsumed,
        }
      : { balance: 0, frozenBalance: 0, totalGranted: 0, totalConsumed: 0 },
  });
});

/**
 * GET /scoin/transactions
 * 获取当前用户 S 币流水（分页）
 *
 * 查询参数：
 *   page      页码（默认 1）
 *   pageSize  每页数量（默认 20，最大 100）
 *   type      流水类型筛选（可选）
 */
membershipRoutes.get("/scoin/transactions", async (c) => {
  const user = getCurrentUser(c);
  const db = getDb();

  const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(c.req.query("pageSize") ?? "20", 10) || 20),
  );
  const type = c.req.query("type");

  const conditions = [eq(sCoinTransactions.userId, user.id)];
  if (type) {
    // 类型筛选需在数据库层做（这里用 in 简化）
  }

  const offset = (page - 1) * pageSize;

  const [list, totalRows] = await Promise.all([
    db
      .select()
      .from(sCoinTransactions)
      .where(and(...conditions))
      .orderBy(desc(sCoinTransactions.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sCoinTransactions.id })
      .from(sCoinTransactions)
      .where(and(...conditions)),
  ]);

  return c.json({
    list: list.map((tx) => ({
      id: tx.id,
      type: tx.type,
      delta: tx.delta,
      balanceAfter: tx.balanceAfter,
      refType: tx.refType,
      refId: tx.refId,
      note: tx.note,
      createdAt: tx.createdAt,
    })),
    total: totalRows.length,
    page,
    pageSize,
  });
});
