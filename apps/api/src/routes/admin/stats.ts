/**
 * 管理后台 - 数据看板路由
 *
 * 端点：
 *   GET /admin/stats        基础统计（用户/构建/产品/交易/创作者 + 最近 10 条）
 *   GET /admin/dashboard    业务仪表盘（会员分布 + S 币统计 + 收入 + 构建状态分布）
 *
 * 迭代 14E：新增 /dashboard 端点为业务仪表盘提供数据
 */
import { Hono } from "hono";
import { desc, count, sql, eq } from "drizzle-orm";

import {
  users,
  buildSessions,
  storeProducts,
  transactions,
  creatorProfiles,
  userMemberships,
  sCoinBalances,
} from "@lynxkit/db";

import { getDb } from "../../lib/db.js";
import { cached } from "../../lib/cache.js";

export const statsRoutes = new Hono();

/**
 * GET /admin/stats
 * 基础统计：各项总数 + 最近 10 条
 * 缓存 30 秒（数据看板不需要实时性）
 */
statsRoutes.get("/stats", async (c) => {
  const result = await cached("admin:stats", async () => {
    const db = getDb();

    // 并行查询各项统计
    const [userCount, buildCount, productCount, txCount, creatorCount] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(buildSessions),
      db.select({ count: count() }).from(storeProducts),
      db.select({ count: count() }).from(transactions),
      db.select({ count: count() }).from(creatorProfiles),
    ]);

    // 最近 10 个新增用户
    const recentUsers = await db
      .select({
        id: users.id,
        phone: users.phone,
        name: users.name,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(10);

    // 最近 10 个构建会话
    const recentBuilds = await db
      .select({
        id: buildSessions.id,
        status: buildSessions.status,
        productType: buildSessions.productType,
        createdAt: buildSessions.createdAt,
      })
      .from(buildSessions)
      .orderBy(desc(buildSessions.createdAt))
      .limit(10);

    return {
      totals: {
        users: userCount[0]?.count ?? 0,
        builds: buildCount[0]?.count ?? 0,
        products: productCount[0]?.count ?? 0,
        transactions: txCount[0]?.count ?? 0,
        creators: creatorCount[0]?.count ?? 0,
      },
      recent: {
        users: recentUsers,
        builds: recentBuilds,
      },
    };
  }, 30);

  return c.json(result);
});

/**
 * GET /admin/dashboard
 * 业务仪表盘：综合业务指标
 *   - 会员分布（按档位统计 ACTIVE 用户数）
 *   - S 币统计（总余额 + 总冻结 + 总赠送 + 总消耗）
 *   - 收入统计（已完成交易总额 + 平台抽成 + 创作者收益）
 *   - 构建状态分布（DEPLOYED / BUILDING / ERROR / PENDING 等）
 *   - 产品状态分布（PUBLISHED / DRAFT / PENDING_REVIEW 等）
 *   - 最近 7 天每日新增用户数
 *   - 最近 7 天每日新增构建数
 *
 * 缓存 60 秒
 */
statsRoutes.get("/dashboard", async (c) => {
  const result = await cached("admin:dashboard", async () => {
    const db = getDb();

    // ===== 1. 会员分布：每个 tier 的 ACTIVE 用户数 + 总用户数 =====
    const membershipDistribution = await db
      .select({
        tier: userMemberships.tier,
        activeCount: count(),
      })
      .from(userMemberships)
      .where(eq(userMemberships.status, "ACTIVE"))
      .groupBy(userMemberships.tier);

    // ===== 2. S 币统计：总余额 + 总冻结 + 总赠送 + 总消耗 =====
    const scoinStats = await db
      .select({
        totalBalance: sql<number>`COALESCE(SUM(${sCoinBalances.balance}), 0)::int`,
        totalFrozen: sql<number>`COALESCE(SUM(${sCoinBalances.frozenBalance}), 0)::int`,
        totalGranted: sql<number>`COALESCE(SUM(${sCoinBalances.totalGranted}), 0)::int`,
        totalConsumed: sql<number>`COALESCE(SUM(${sCoinBalances.totalConsumed}), 0)::int`,
      })
      .from(sCoinBalances);

    // ===== 3. 收入统计：已完成交易金额 + 平台抽成 + 创作者收益 =====
    const revenueStats = await db
      .select({
        totalAmount: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
        totalPlatformFee: sql<string>`COALESCE(SUM(${transactions.platformFee}), 0)`,
        totalSellerRevenue: sql<string>`COALESCE(SUM(${transactions.sellerRevenue}), 0)`,
        completedCount: count(),
      })
      .from(transactions)
      .where(eq(transactions.status, "COMPLETED"));

    // ===== 4. 构建状态分布 =====
    const buildStatusDist = await db
      .select({
        status: buildSessions.status,
        count: count(),
      })
      .from(buildSessions)
      .groupBy(buildSessions.status);

    // ===== 5. 产品状态分布 =====
    const productStatusDist = await db
      .select({
        status: storeProducts.status,
        count: count(),
      })
      .from(storeProducts)
      .groupBy(storeProducts.status);

    // ===== 6. 最近 7 天每日新增用户数 =====
    const last7daysUsers = await db
      .select({
        date: sql<string>`TO_CHAR(${users.createdAt}, 'YYYY-MM-DD')`,
        count: count(),
      })
      .from(users)
      .where(sql`${users.createdAt} >= NOW() - INTERVAL '7 days'`)
      .groupBy(sql`TO_CHAR(${users.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`TO_CHAR(${users.createdAt}, 'YYYY-MM-DD')`);

    // ===== 7. 最近 7 天每日新增构建数 =====
    const last7daysBuilds = await db
      .select({
        date: sql<string>`TO_CHAR(${buildSessions.createdAt}, 'YYYY-MM-DD')`,
        count: count(),
      })
      .from(buildSessions)
      .where(sql`${buildSessions.createdAt} >= NOW() - INTERVAL '7 days'`)
      .groupBy(sql`TO_CHAR(${buildSessions.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`TO_CHAR(${buildSessions.createdAt}, 'YYYY-MM-DD')`);

    return {
      membership: {
        distribution: membershipDistribution.map((m) => ({
          tier: m.tier,
          activeCount: Number(m.activeCount),
        })),
      },
      scoin: {
        totalBalance: scoinStats[0]?.totalBalance ?? 0,
        totalFrozen: scoinStats[0]?.totalFrozen ?? 0,
        totalGranted: scoinStats[0]?.totalGranted ?? 0,
        totalConsumed: scoinStats[0]?.totalConsumed ?? 0,
      },
      revenue: {
        totalAmount: revenueStats[0]?.totalAmount ?? "0",
        totalPlatformFee: revenueStats[0]?.totalPlatformFee ?? "0",
        totalSellerRevenue: revenueStats[0]?.totalSellerRevenue ?? "0",
        completedCount: Number(revenueStats[0]?.completedCount ?? 0),
      },
      builds: {
        statusDistribution: buildStatusDist.map((b) => ({
          status: b.status,
          count: Number(b.count),
        })),
      },
      products: {
        statusDistribution: productStatusDist.map((p) => ({
          status: p.status,
          count: Number(p.count),
        })),
      },
      trends: {
        last7days: {
          users: last7daysUsers.map((u) => ({
            date: u.date,
            count: Number(u.count),
          })),
          builds: last7daysBuilds.map((b) => ({
            date: b.date,
            count: Number(b.count),
          })),
        },
      },
    };
  }, 60);

  return c.json(result);
});
