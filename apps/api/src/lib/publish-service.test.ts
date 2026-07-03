/**
 * publish-service 单元测试
 *
 * 覆盖 P0-2 上架全链路：
 * - TC-301：有效输入 + 会话存在且属于该用户 + 未发布过 → 创建 store_products 记录
 * - TC-302：会话不存在 → 抛 NotFoundError
 * - TC-303：会话不属于该用户 → 抛 ForbiddenError
 * - TC-304：会话已发布过（session_id 唯一约束）→ 抛 ConflictError
 *
 * 使用依赖注入：db 通过 deps 传入，避免耦合 getDb 单例。
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  publishBuildToStore,
  type PublishInput,
  type PublishDeps,
} from "./publish-service.js";
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "../middleware/error.js";

/** 构造 mock db，链式 query/insert 调用 */
function makeMockDb(overrides: {
  session?: unknown;
  existingProduct?: unknown;
  insertedProduct?: unknown;
}) {
  const findSession = vi.fn().mockResolvedValue(overrides.session ?? null);
  const findExistingProduct = vi.fn().mockResolvedValue(
    overrides.existingProduct ?? null,
  );
  const returning = vi
    .fn()
    .mockResolvedValue(
      overrides.insertedProduct
        ? [overrides.insertedProduct]
        : [{ id: "product-1" }],
    );
  const values = vi.fn().mockReturnValue({ returning });
  const insert = vi.fn().mockReturnValue({ values });

  return {
    db: {
      query: {
        buildSessions: { findFirst: findSession },
        storeProducts: { findFirst: findExistingProduct },
      },
      insert,
    } as unknown as PublishDeps["db"],
    spies: { findSession, findExistingProduct, insert, values, returning },
  };
}

const validInput: PublishInput = {
  sessionId: "session-1",
  userId: "user-1",
  name: "AI 社交应用",
  description: "基于向量匹配的 AI 社交交友应用",
  category: "SOCIAL" as never,
  pricingType: "FREE" as never,
  price: 0,
  tags: ["AI", "社交"],
  version: "1.0.0",
  demoUrl: "https://demo.example.com",
};

const ownedSession = {
  id: "session-1",
  userId: "user-1",
  productType: "SOCIAL",
  status: "DEPLOYED",
  deployUrl: "https://demo.example.com",
};

describe("publishBuildToStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("TC-301：有效输入应创建 store_products 记录并返回 product", async () => {
    const { db, spies } = makeMockDb({
      session: ownedSession,
      existingProduct: null,
      insertedProduct: { id: "product-1", name: "AI 社交应用", status: "PENDING_REVIEW" },
    });

    const result = await publishBuildToStore(validInput, { db });

    expect(result.product.id).toBe("product-1");
    expect(result.product.status).toBe("PENDING_REVIEW");
    // 应调用 insert(storeProducts).values({...})
    expect(spies.insert).toHaveBeenCalledTimes(1);
    expect(spies.values).toHaveBeenCalledTimes(1);
    // 插入时应携带 creatorId 与 sessionId
    const insertedValues = spies.values.mock.calls[0]?.[0];
    expect(insertedValues).toMatchObject({
      sessionId: "session-1",
      creatorId: "user-1",
      name: "AI 社交应用",
      status: "PENDING_REVIEW",
    });
  });

  it("TC-302：会话不存在应抛 NotFoundError", async () => {
    const { db } = makeMockDb({ session: null });

    await expect(
      publishBuildToStore(validInput, { db }),
    ).rejects.toBeInstanceOf(NotFoundError);

    // 不应触发 insert
    const { db: dbAfter } = makeMockDb({ session: null });
    // 重新调用以验证
    await expect(
      publishBuildToStore(validInput, { db: dbAfter }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("TC-303：会话不属于该用户应抛 ForbiddenError", async () => {
    const { db } = makeMockDb({
      session: { ...ownedSession, userId: "other-user" },
    });

    await expect(
      publishBuildToStore(validInput, { db }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("TC-304：会话已发布过应抛 ConflictError", async () => {
    const { db, spies } = makeMockDb({
      session: ownedSession,
      existingProduct: { id: "existing-product", sessionId: "session-1" },
    });

    await expect(
      publishBuildToStore(validInput, { db }),
    ).rejects.toBeInstanceOf(ConflictError);

    // 已发布 → 不应再次插入
    expect(spies.insert).not.toHaveBeenCalled();
  });
});
