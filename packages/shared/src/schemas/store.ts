/**
 * 商店上架 / 交易 / 评价 Zod schema - LynxKit v1.0
 */

import { z } from "zod";
import { ProductType } from "../types/product.js";
import {
  StoreCategory,
  PricingType,
  StoreStatus,
  TransactionType,
  TransactionStatus,
} from "../types/store.js";

/**
 * 商店分类 schema
 */
export const storeCategorySchema = z.nativeEnum(StoreCategory);

/**
 * 定价类型 schema
 */
export const pricingTypeSchema = z.nativeEnum(PricingType);

/**
 * 商店产品状态 schema
 */
export const storeStatusSchema = z.nativeEnum(StoreStatus);

/**
 * 交易类型 schema
 */
export const transactionTypeSchema = z.nativeEnum(TransactionType);

/**
 * 交易状态 schema
 */
export const transactionStatusSchema = z.nativeEnum(TransactionStatus);

/**
 * 价格（分）schema：非负整数
 */
export const priceSchema = z.number().int().min(0, "价格不能为负");

/**
 * 上架商店产品
 */
export const createStoreProductSchema = z.object({
  name: z.string().min(2, "名称至少 2 字").max(80, "名称最多 80 字"),
  description: z.string().min(10, "简介至少 10 字").max(500, "简介最多 500 字"),
  readme: z.string().max(50000, "说明文档最多 50000 字").optional(),
  category: storeCategorySchema,
  productType: z.nativeEnum(ProductType),
  pricingType: pricingTypeSchema,
  price: priceSchema,
  subscriptionMonths: z.number().int().min(1).max(12).optional(),
  coverUrl: z.string().url().optional(),
  demoUrl: z.string().url().optional(),
  repoUrl: z.string().url().optional(),
  tags: z.array(z.string().min(1).max(20)).max(10, "最多 10 个标签").default([]),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, "版本号格式 x.y.z").default("1.0.0"),
});

/**
 * 更新商店产品
 */
export const updateStoreProductSchema = createStoreProductSchema.partial();

/**
 * 商店产品状态变更
 */
export const changeStoreStatusSchema = z.object({
  productId: z.string().min(1),
  status: storeStatusSchema,
  reason: z.string().max(200).optional(),
});

/**
 * 创建交易（购买）
 */
export const createTransactionSchema = z.object({
  productId: z.string().min(1),
  type: z.enum([TransactionType.PURCHASE, TransactionType.SUBSCRIBE]),
  paymentMethod: z.string().min(1, "请选择支付方式"),
  couponCode: z.string().optional(),
});

/**
 * 退款申请
 */
export const refundTransactionSchema = z.object({
  transactionId: z.string().min(1),
  reason: z.string().min(1, "请填写退款原因").max(500),
});

/**
 * 创建评价
 */
export const createReviewSchema = z.object({
  productId: z.string().min(1),
  transactionId: z.string().min(1),
  rating: z.number().int().min(1, "评分至少 1").max(5, "评分最高 5"),
  content: z.string().max(1000, "评价最多 1000 字").optional(),
});

/**
 * 创作者回复评价
 */
export const replyReviewSchema = z.object({
  reviewId: z.string().min(1),
  reply: z.string().min(1, "回复内容不能为空").max(500, "回复最多 500 字"),
});

/**
 * 创作者提现申请
 */
export const withdrawSchema = z.object({
  amount: z.number().int().positive("提现金额必须大于 0"),
  accountId: z.string().min(1, "请选择提现账户"),
});
