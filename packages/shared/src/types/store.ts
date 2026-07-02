/**
 * 商店（Store）相关类型 - LynxKit v1.0
 *
 * 包含上架产品、交易、评价、创作者档案、分类、定价、状态等。
 */

import type { ProductType } from "./product.js";

/**
 * 商店产品分类
 */
export enum StoreCategory {
  /** 模板 */
  TEMPLATE = "template",
  /** 插件 */
  PLUGIN = "plugin",
  /** 组件 */
  COMPONENT = "component",
  /** 完整应用 */
  APP = "app",
  /** AI 提示词 */
  PROMPT = "prompt",
  /** 工作流 */
  WORKFLOW = "workflow",
}

/**
 * 商店产品定价类型
 */
export enum PricingType {
  /** 免费 */
  FREE = "free",
  /** 一次性买断 */
  ONETIME = "onetime",
  /** 订阅 */
  SUBSCRIPTION = "subscription",
  /** 按量计费 */
  USAGE = "usage",
}

/**
 * 商店产品状态
 */
export enum StoreStatus {
  /** 草稿 */
  DRAFT = "draft",
  /** 审核中 */
  PENDING = "pending",
  /** 已上架 */
  PUBLISHED = "published",
  /** 已下架 */
  UNPUBLISHED = "unpublished",
  /** 审核拒绝 */
  REJECTED = "rejected",
  /** 已删除 */
  REMOVED = "removed",
}

/**
 * 交易类型
 */
export enum TransactionType {
  /** 购买 */
  PURCHASE = "purchase",
  /** 订阅 */
  SUBSCRIBE = "subscribe",
  /** 退款 */
  REFUND = "refund",
  /** 创作者提现 */
  WITHDRAW = "withdraw",
  /** 平台分成 */
  COMMISSION = "commission",
}

/**
 * 交易状态
 */
export enum TransactionStatus {
  /** 待支付 */
  PENDING = "pending",
  /** 已支付 */
  PAID = "paid",
  /** 已完成 */
  COMPLETED = "completed",
  /** 已退款 */
  REFUNDED = "refunded",
  /** 已取消 */
  CANCELLED = "cancelled",
  /** 失败 */
  FAILED = "failed",
}

/**
 * 商店上架产品
 */
export interface StoreProduct {
  /** 产品 ID */
  id: string;
  /** 创作者用户 ID */
  creatorId: string;
  /** 产品名称 */
  name: string;
  /** 简介 */
  description: string;
  /** 详细说明（Markdown） */
  readme?: string;
  /** 分类 */
  category: StoreCategory;
  /** 对应的产品类型（生成场景归类） */
  productType: ProductType;
  /** 定价类型 */
  pricingType: PricingType;
  /** 价格（分），FREE 时为 0 */
  price: number;
  /** 订阅周期（月），仅 SUBSCRIPTION 有效 */
  subscriptionMonths?: number;
  /** 状态 */
  status: StoreStatus;
  /** 封面图 URL */
  coverUrl?: string;
  /** 演示地址 */
  demoUrl?: string;
  /** 源码仓库地址 */
  repoUrl?: string;
  /** 下载次数 */
  downloadCount: number;
  /** 评分均值（0~5） */
  ratingAvg: number;
  /** 评价数 */
  ratingCount: number;
  /** 标签 */
  tags: string[];
  /** 版本号 */
  version: string;
  /** 创建时间（ISO 字符串） */
  createdAt: string;
  /** 更新时间（ISO 字符串） */
  updatedAt: string;
}

/**
 * 交易记录
 */
export interface Transaction {
  /** 交易 ID */
  id: string;
  /** 订单号（对外展示） */
  orderNo: string;
  /** 购买者用户 ID */
  userId: string;
  /** 创作者用户 ID */
  creatorId: string;
  /** 关联商店产品 ID */
  productId: string;
  /** 交易类型 */
  type: TransactionType;
  /** 交易状态 */
  status: TransactionStatus;
  /** 交易金额（分） */
  amount: number;
  /** 平台抽成比例（0~1） */
  commissionRate: number;
  /** 创作者实得金额（分） */
  creatorIncome: number;
  /** 支付方式 */
  paymentMethod?: string;
  /** 第三方支付流水号 */
  paymentNo?: string;
  /** 退款原因 */
  refundReason?: string;
  /** 创建时间（ISO 字符串） */
  createdAt: string;
  /** 支付完成时间（ISO 字符串） */
  paidAt?: string;
  /** 完成时间（ISO 字符串） */
  completedAt?: string;
}

/**
 * 用户对商店产品的评价
 */
export interface Review {
  /** 评价 ID */
  id: string;
  /** 评价者用户 ID */
  userId: string;
  /** 被评价产品 ID */
  productId: string;
  /** 关联交易 ID（必须购买后才能评价） */
  transactionId: string;
  /** 评分（1~5） */
  rating: number;
  /** 评价内容 */
  content?: string;
  /** 评价者是否购买后评价 */
  verified: boolean;
  /** 创作者回复 */
  creatorReply?: string;
  /** 创作者回复时间（ISO 字符串） */
  creatorRepliedAt?: string;
  /** 创建时间（ISO 字符串） */
  createdAt: string;
  /** 更新时间（ISO 字符串） */
  updatedAt: string;
}

/**
 * 创作者档案
 */
export interface CreatorProfile {
  /** 创作者用户 ID */
  userId: string;
  /** 创作者昵称（公开） */
  displayName: string;
  /** 个人简介 */
  bio?: string;
  /** 头像 URL */
  avatarUrl?: string;
  /** 个人主页 / 官网 */
  website?: string;
  /** 实名认证状态 */
  verified: boolean;
  /** 累计销售额（分） */
  totalIncome: number;
  /** 累计提现金额（分） */
  totalWithdrawn: number;
  /** 可提现余额（分） */
  balance: number;
  /** 上架产品数 */
  productCount: number;
  /** 总下载量 */
  totalDownloads: number;
  /** 平均评分 */
  avgRating: number;
  /** 是否签署创作者协议 */
  agreementSigned: boolean;
  /** 签署时间（ISO 字符串） */
  agreementSignedAt?: string;
  /** 创建时间（ISO 字符串） */
  createdAt: string;
  /** 更新时间（ISO 字符串） */
  updatedAt: string;
}
