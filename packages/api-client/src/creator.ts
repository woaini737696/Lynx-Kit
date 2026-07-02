/**
 * 创作者 API
 *
 * 封装创作者中心的档案管理、产品列表、收益统计、提现等接口。
 * 实体类型 CreatorProfile / StoreProduct / Transaction 来自 @lynxkit/shared。
 */
import type { ApiClient } from "./client.js";
import type {
  CreatorProfile,
  StoreProduct,
  Transaction,
} from "@lynxkit/shared";
import type {
  UpdateCreatorInput,
  CreatorStats,
  WithdrawInput,
} from "./types.js";

export class CreatorApi {
  constructor(private readonly client: ApiClient) {}

  /** 获取当前用户的创作者档案（未开通时返回 null） */
  async getProfile(): Promise<CreatorProfile | null> {
    return this.client.get<CreatorProfile | null>("/v1/creator/profile");
  }

  /** 开通创作者中心 */
  async enable(input: UpdateCreatorInput = {}): Promise<CreatorProfile> {
    return this.client.post<CreatorProfile>("/v1/creator/enable", input);
  }

  /** 更新创作者档案 */
  async updateProfile(input: UpdateCreatorInput): Promise<CreatorProfile> {
    return this.client.put<CreatorProfile>("/v1/creator/profile", input);
  }

  /** 列出创作者已上架的产品 */
  async listProducts(): Promise<StoreProduct[]> {
    return this.client.get<StoreProduct[]>("/v1/creator/products");
  }

  /** 列出创作者的收益交易记录 */
  async listRevenue(): Promise<Transaction[]> {
    return this.client.get<Transaction[]>("/v1/creator/revenue");
  }

  /** 获取创作者收益统计 */
  async getStats(): Promise<CreatorStats> {
    return this.client.get<CreatorStats>("/v1/creator/stats");
  }

  /** 申请提现 */
  async withdraw(input: WithdrawInput): Promise<Transaction> {
    return this.client.post<Transaction>("/v1/creator/withdraw", input);
  }
}
