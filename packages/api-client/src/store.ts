/**
 * 商店 API
 *
 * 封装 AI 应用商店的产品浏览 / 发布 / 交易 / 评价等接口。
 * 实体类型 StoreProduct / Transaction / Review 来自 @lynxkit/shared。
 */
import type { ApiClient } from "./client.js";
import type { StoreProduct, Transaction, Review } from "@lynxkit/shared";
import type {
  ListStoreQuery,
  StoreListResult,
  PublishStoreProductInput,
  UpdateStoreProductInput,
  PublishResult,
  CreateTransactionInput,
  CreateReviewInput,
} from "./types.js";

export class StoreApi {
  constructor(private readonly client: ApiClient) {}

  /** 分页浏览商店产品 */
  async list(query: ListStoreQuery = {}): Promise<StoreListResult> {
    return this.client.post<StoreListResult>("/v1/store/list", query);
  }

  /** 获取商店产品详情 */
  async getById(id: string): Promise<StoreProduct> {
    return this.client.get<StoreProduct>(`/v1/store/${id}`);
  }

  /** 从构建会话上架产品 */
  async publish(input: PublishStoreProductInput): Promise<PublishResult> {
    return this.client.post<PublishResult>("/v1/store/publish", input);
  }

  /** 更新产品信息 */
  async update(
    id: string,
    input: UpdateStoreProductInput,
  ): Promise<StoreProduct> {
    return this.client.put<StoreProduct>(`/v1/store/${id}`, input);
  }

  /** 下架产品 */
  async unpublish(id: string): Promise<{ ok: boolean }> {
    return this.client.post<{ ok: boolean }>(`/v1/store/${id}/unpublish`);
  }

  /** 获取当前用户的购买记录 */
  async myTransactions(): Promise<Transaction[]> {
    return this.client.get<Transaction[]>("/v1/store/transactions");
  }

  /** 购买产品（生成交易订单） */
  async purchase(input: CreateTransactionInput): Promise<Transaction> {
    return this.client.post<Transaction>("/v1/store/purchase", input);
  }

  /** 获取产品的评价列表 */
  async listReviews(productId: string): Promise<Review[]> {
    return this.client.get<Review[]>(`/v1/store/${productId}/reviews`);
  }

  /** 对产品发表评价 */
  async createReview(input: CreateReviewInput): Promise<Review> {
    return this.client.post<Review>("/v1/store/reviews", input);
  }
}
