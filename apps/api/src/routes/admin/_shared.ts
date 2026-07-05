/**
 * 管理后台共享工具 - LynxKit API
 *
 * 包含：
 *   - paginationSchema：分页参数 Zod schema（各模块复用）
 *   - grantSCoinInternal：S 币余额调整 + 流水写入（会员开通/调整复用）
 *
 * 此文件不导出路由，仅导出工具函数与 schema。
 */
import { z } from "zod";
import { eq } from "drizzle-orm";

import { sCoinBalances, sCoinTransactions } from "@lynxkit/db";

import type { getDb } from "../../lib/db.js";
import { recordSCoinTransaction } from "../../lib/metrics.js";
import { BadRequestError } from "../../middleware/error.js";

/**
 * 分页参数 schema（所有 admin 列表接口共用）
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  role: z.string().optional(),
});

/**
 * 内部工具函数：调整 S 币余额并写流水
 *
 * - 余额表不存在时自动插入
 * - delta 正数为增加，负数为减少（扣减时不允许透支，需先校验）
 * - 写入流水记录 balanceAfter
 *
 * @param db - Drizzle 数据库实例
 * @param userId - 目标用户 ID
 * @param delta - 变动数额（正增负减）
 * @param type - 流水类型
 * @param operatorId - 操作者 ID（用于审计）
 * @param note - 备注
 * @param refType - 关联类型（如 "membership" / "admin_adjust"）
 * @param refId - 关联 ID
 */
export async function grantSCoinInternal(
  db: ReturnType<typeof getDb>,
  userId: string,
  delta: number,
  type: "RECHARGE" | "CONSUME" | "GRANT" | "REFUND" | "EXCHANGE" | "ADJUST",
  operatorId: string,
  note: string,
  refType: string | null,
  refId: string | null,
): Promise<{ balanceAfter: number; txId: string }> {
  // 1. 查询当前余额（不存在则初始化）
  const existing = await db
    .select()
    .from(sCoinBalances)
    .where(eq(sCoinBalances.userId, userId))
    .limit(1)
    .then((rows) => rows[0]);

  const currentBalance = existing?.balance ?? 0;
  const newBalance = currentBalance + delta;

  if (newBalance < 0) {
    throw new BadRequestError(
      `余额不足：当前 ${currentBalance}，尝试扣减 ${Math.abs(delta)}`,
    );
  }

  // 2. 更新或插入余额表
  if (existing) {
    await db
      .update(sCoinBalances)
      .set({
        balance: newBalance,
        totalGranted: delta > 0 ? (existing.totalGranted ?? 0) + delta : existing.totalGranted,
        totalConsumed: delta < 0 ? (existing.totalConsumed ?? 0) + Math.abs(delta) : existing.totalConsumed,
        updatedAt: new Date(),
      })
      .where(eq(sCoinBalances.userId, userId));
  } else {
    await db.insert(sCoinBalances).values({
      userId,
      balance: newBalance,
      totalGranted: delta > 0 ? delta : 0,
      totalConsumed: delta < 0 ? Math.abs(delta) : 0,
    });
  }

  // 3. 写流水
  const [tx] = await db
    .insert(sCoinTransactions)
    .values({
      userId,
      type,
      delta,
      balanceAfter: newBalance,
      refType,
      refId,
      operatorId,
      note,
    })
    .returning();

  if (!tx) {
    throw new Error("S 币流水写入失败");
  }

  // 记录 Prometheus 业务指标（S 币交易计数）
  recordSCoinTransaction(type);

  return { balanceAfter: newBalance, txId: tx.id };
}
