/**
 * 商店 API
 *
 * 封装 AI 应用商店的产品浏览 / 发布 / 交易 / 评价等接口。
 * 实体类型 StoreProduct / Transaction / Review 来自 @lynxkit/shared。
 *
 * 路径对齐后端 apps/api/src/routes/store.ts：
 *   GET  /store                      分页列表（query: page/pageSize/category/sort）
 *   GET  /store/:productId           产品详情
 *   POST /store/:productId/purchase  购买
 *   POST /store/:productId/review    评价
 *   GET  /store/:productId/reviews    评价列表（后端补全）
 *   GET  /store/transactions         我的购买记录（后端补全）
 */
import type { ApiClient } from "./client";
import type { StoreProduct, Transaction, Review } from "@lynxkit/shared";
import type {
  ListStoreQuery,
  StoreListResult,
  PublishStoreProductInput,
  UpdateStoreProductInput,
  PublishResult,
  CreateTransactionInput,
  CreateReviewInput,
} from "./types";

export class StoreApi {
  constructor(private readonly client: ApiClient) {}

  /** 分页浏览商店产品（后端用 GET + query） */
  async list(query: ListStoreQuery = {}): Promise<StoreListResult> {
    // 后端 GET /store 接收 query 参数：page/pageSize/category/sort
    const params = new URLSearchParams();
    if (query.page) params.set("page", String(query.page));
    if (query.pageSize) params.set("pageSize", String(query.pageSize));
    if ((query as any).category) params.set("category", (query as any).category);
    if ((query as any).sort) params.set("sort", (query as any).sort);
    const qs = params.toString();
    const data = await this.client.get<{
      products: StoreProduct[];
      page: number;
      pageSize: number;
      total: number;
    }>(`/v1/store${qs ? `?${qs}` : ""}`);
    const pageSize = data.pageSize || 20;
    return {
      items: data.products,
      total: data.total,
      page: data.page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(data.total / pageSize)),
    };
  }

  /** 获取商店产品详情 */
  async getById(id: string): Promise<StoreProduct> {
    const data = await this.client.get<{ product: StoreProduct }>(
      `/v1/store/${id}`,
    );
    return data.product;
  }

  /** 从构建会话上架产品到商店（POST /v1/store/publish） */
  async publish(input: PublishStoreProductInput): Promise<PublishResult> {
    return this.client.post<PublishResult>("/v1/store/publish", input);
  }

  /** 更新产品信息（后端暂未实现） */
  async update(
    id: string,
    input: UpdateStoreProductInput,
  ): Promise<StoreProduct> {
    return this.client.put<StoreProduct>(`/v1/store/${id}`, input);
  }

  /** 下架产品（后端暂未实现） */
  async unpublish(id: string): Promise<{ ok: boolean }> {
    return this.client.post<{ ok: boolean }>(`/v1/store/${id}/unpublish`);
  }

  /** 获取当前用户的购买记录（后端补全：GET /store/transactions） */
  async myTransactions(): Promise<Transaction[]> {
    const data = await this.client.get<{ transactions: Transaction[] }>(
      "/v1/store/transactions",
    );
    return data.transactions ?? [];
  }

  /** 购买产品（路径参数 productId） */
  async purchase(input: CreateTransactionInput): Promise<Transaction> {
    const productId = (input as any).productId;
    const data = await this.client.post<{ transaction: Transaction }>(
      `/v1/store/${productId}/purchase`,
      { paymentMethod: (input as any).paymentMethod ?? "ALIPAY" },
    );
    return data.transaction;
  }

  /** 获取产品的评价列表（后端补全：GET /store/:productId/reviews） */
  async listReviews(productId: string): Promise<Review[]> {
    const data = await this.client.get<{ reviews: Review[] }>(
      `/v1/store/${productId}/reviews`,
    );
    return data.reviews ?? [];
  }

  /** 对产品发表评价（路径参数 productId） */
  async createReview(input: CreateReviewInput): Promise<Review> {
    const productId = (input as any).productId;
    const data = await this.client.post<{ review: Review }>(
      `/v1/store/${productId}/review`,
      {
        transactionId: (input as any).transactionId,
        rating: (input as any).rating,
        content: (input as any).content,
      },
    );
    return data.review;
  }
}
