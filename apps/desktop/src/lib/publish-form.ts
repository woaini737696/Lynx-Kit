/**
 * 上架表单纯逻辑（TDD：GREEN 实现）
 *
 * 把"填表 → 校验 → 提交 payload"从组件中抽离为纯函数，
 * 便于在 node 环境下进行单元测试，避免引入 jsdom / RTL。
 */
import type { PublishStoreProductInput } from "@lynxkit/api-client";
import { PricingType, StoreCategory, ProductType } from "@lynxkit/shared";

/** 上架表单状态（与 Dialog 输入控件一一对应） */
export interface PublishFormState {
  name: string;
  description: string;
  category: StoreCategory | "";
  pricingType: PricingType | "";
  /** 价格（分），输入框原始字符串 */
  price: string;
  /** 标签，逗号分隔 */
  tags: string;
  /** 版本号，默认 "1.0.0" */
  version: string;
  /** 演示地址，可由 deployUrl 预填 */
  demoUrl: string;
}

export type PublishFormErrors = Partial<
  Record<keyof PublishFormState, string>
>;

/**
 * 校验上架表单，返回错误映射（空对象表示通过）。
 */
export function validatePublishForm(
  form: PublishFormState,
): PublishFormErrors {
  const errors: PublishFormErrors = {};

  if (!form.name || form.name.trim().length < 2) {
    errors.name = "名称至少 2 字";
  } else if (form.name.length > 80) {
    errors.name = "名称最多 80 字";
  }

  if (!form.description || form.description.trim().length < 10) {
    errors.description = "简介至少 10 字";
  } else if (form.description.length > 500) {
    errors.description = "简介最多 500 字";
  }

  if (!form.category) {
    errors.category = "请选择分类";
  }

  if (!form.pricingType) {
    errors.pricingType = "请选择定价类型";
  } else if (form.pricingType !== PricingType.FREE) {
    // 空字符串 / 空白 → Number("") === 0，会误判为有效，需显式拦截
    const trimmedPrice = form.price?.trim() ?? "";
    if (trimmedPrice === "") {
      errors.price = "价格必须为非负数";
    } else {
      const price = Number(trimmedPrice);
      if (!Number.isFinite(price) || price < 0) {
        errors.price = "价格必须为非负数";
      } else if (!Number.isInteger(price)) {
        errors.price = "价格必须为整数（分）";
      }
    }
  }

  if (form.version && !/^\d+\.\d+\.\d+$/.test(form.version)) {
    errors.version = "版本号格式 x.y.z";
  }

  if (form.demoUrl && !/^https?:\/\//.test(form.demoUrl)) {
    errors.demoUrl = "URL 必须以 http(s):// 开头";
  }

  return errors;
}

/**
 * 根据表单状态构造上架请求 payload。
 *
 * - tags 按逗号分隔并去空
 * - FREE 类型强制 price=0
 * - 空 version 兜底 "1.0.0"
 * - 空 demoUrl 转为 undefined
 */
export function buildPublishPayload(
  sessionId: string,
  productType: ProductType,
  form: PublishFormState,
): PublishStoreProductInput {
  const tags = form.tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const price =
    form.pricingType === PricingType.FREE ? 0 : Number(form.price) || 0;

  return {
    sessionId,
    name: form.name.trim(),
    description: form.description.trim(),
    category: form.category as StoreCategory,
    productType,
    pricingType: form.pricingType as PricingType,
    price,
    tags,
    version: form.version.trim() || "1.0.0",
    demoUrl: form.demoUrl.trim() || undefined,
  };
}
