/**
 * ID 生成工具 - LynxKit v1.0
 *
 * 基于 nanoid，提供业务前缀的 ID 生成器。
 */

import { nanoid } from "nanoid";

/**
 * 生成 nanoid（默认 21 位）
 */
export const createId = (size = 21): string => nanoid(size);

/**
 * 生成构建会话 ID（前缀 ses_）
 */
export const createSessionId = (): string => `ses_${nanoid(16)}`;

/**
 * 生成构建 ID（前缀 bld_）
 */
export const createBuildId = (): string => `bld_${nanoid(16)}`;

/**
 * 生成 Agent 日志 ID（前缀 log_）
 */
export const createLogId = (): string => `log_${nanoid(16)}`;

/**
 * 生成交易订单号（前缀 txn_ + 时间戳）
 */
export const createTransactionId = (): string => {
  const ts = Date.now().toString(36);
  return `txn_${ts}${nanoid(10)}`;
};

/**
 * 生成商店产品 ID（前缀 prod_）
 */
export const createProductId = (): string => `prod_${nanoid(16)}`;

/**
 * 生成评价 ID（前缀 rev_）
 */
export const createReviewId = (): string => `rev_${nanoid(16)}`;

/**
 * 生成短 ID（8 位，用于分享链接）
 */
export const createShortId = (length = 8): string => nanoid(length);

/**
 * 生成随机 token（用于 refresh token / API token）
 */
export const createToken = (size = 32): string => nanoid(size);
