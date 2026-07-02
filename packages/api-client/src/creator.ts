/**
 * 创作者 API
 *
 * 封装创作者中心的档案管理、产品列表、收益统计、提现等接口。
 * 实体类型 CreatorProfile / StoreProduct / Transaction 来自 @lynxkit/shared。
 *
 * 路径对齐后端 apps/api/src/routes/creator.ts：
 *   GET  /creator/profile      档案
 *   POST /creator/profile      创建/更新档案
 *   GET  /creator/products     我的产品
 *   GET  /creator/earnings     收益记录
 *   GET  /creator/analytics    收益统计
 */
import type { ApiClient } from "./client";
import type {
  CreatorProfile,
  StoreProduct,
  Transaction,
} from "@lynxkit/shared";
import type {
  UpdateCreatorInput,
  CreatorStats,
  WithdrawInput,
} from "./types";

export class CreatorApi {
  constructor(private readonly client: ApiClient) {}

  /** 获取当前用户的创作者档案（未开通时返回 null） */
  async getProfile(): Promise<CreatorProfile | null> {
    const data = await this.client.get<{ profile: CreatorProfile | null }>(
      "/v1/creator/profile",
    );
    return data.profile ?? null;
  }

  /** 开通创作者中心（后端用 POST /profile 创建档案） */
  async enable(input: UpdateCreatorInput = {}): Promise<CreatorProfile> {
    const data = await this.client.post<{ profile: CreatorProfile }>(
      "/v1/creator/profile",
      input,
    );
    return data.profile;
  }

  /** 更新创作者档案（后端只有 POST /profile，复用即可） */
  async updateProfile(input: UpdateCreatorInput): Promise<CreatorProfile> {
    const data = await this.client.post<{ profile: CreatorProfile }>(
      "/v1/creator/profile",
      input,
    );
    return data.profile;
  }

  /** 列出创作者已上架的产品 */
  async listProducts(): Promise<StoreProduct[]> {
    const data = await this.client.get<{ products: StoreProduct[] }>(
      "/v1/creator/products",
    );
    return data.products ?? [];
  }

  /** 列出创作者的收益交易记录（后端为 /earnings） */
  async listRevenue(): Promise<Transaction[]> {
    const data = await this.client.get<{ transactions: Transaction[] }>(
      "/v1/creator/earnings",
    );
    return data.transactions ?? [];
  }

  /** 获取创作者收益统计（后端为 /analytics） */
  async getStats(): Promise<CreatorStats> {
    return this.client.get<CreatorStats>("/v1/creator/analytics");
  }

  /** 申请提现（后端暂未实现） */
  async withdraw(input: WithdrawInput): Promise<Transaction> {
    return this.client.post<Transaction>("/v1/creator/withdraw", input);
  }
}
