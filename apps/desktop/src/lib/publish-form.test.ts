/**
 * 上架表单纯逻辑测试（TDD：RED 阶段）
 *
 * 测试目标：apps/desktop/src/lib/publish-form.ts
 * 覆盖范围：validatePublishForm / buildPublishPayload
 */
import { describe, it, expect } from "vitest";
import {
  validatePublishForm,
  buildPublishPayload,
  type PublishFormState,
} from "./publish-form";
import { PricingType, StoreCategory, ProductType } from "@lynxkit/shared";

/** 有效表单样板（每个用例在此基础上微调） */
function validForm(): PublishFormState {
  return {
    name: "AI 客服小助手",
    description: "基于 LLM 的智能客服回复组件，支持多轮对话与意图识别",
    category: StoreCategory.SOCIAL,
    pricingType: PricingType.FREE,
    price: "",
    tags: "AI,客服,LLM",
    version: "1.0.0",
    demoUrl: "https://lynxkit-abc123.aliyuncs.com",
  };
}

describe("validatePublishForm", () => {
  it("TC-401: 有效表单返回空错误对象", () => {
    const errors = validatePublishForm(validForm());
    expect(errors).toEqual({});
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("TC-402: 名称过短返回 name 错误", () => {
    const form = validForm();
    form.name = "A";
    const errors = validatePublishForm(form);
    expect(errors.name).toBe("名称至少 2 字");
  });

  it("TC-403: 简介过短返回 description 错误", () => {
    const form = validForm();
    form.description = "太短";
    const errors = validatePublishForm(form);
    expect(errors.description).toBe("简介至少 10 字");
  });

  it("TC-404: 未选择分类返回 category 错误", () => {
    const form = validForm();
    form.category = "";
    const errors = validatePublishForm(form);
    expect(errors.category).toBe("请选择分类");
  });

  it("TC-405: 未选择定价类型返回 pricingType 错误", () => {
    const form = validForm();
    form.pricingType = "";
    const errors = validatePublishForm(form);
    expect(errors.pricingType).toBe("请选择定价类型");
  });

  it("TC-406: 非免费定价但价格为空返回 price 错误", () => {
    const form = validForm();
    form.pricingType = PricingType.ONETIME;
    form.price = "";
    const errors = validatePublishForm(form);
    expect(errors.price).toBe("价格必须为非负数");
  });

  it("TC-407: 非免费定价且价格为负数返回 price 错误", () => {
    const form = validForm();
    form.pricingType = PricingType.ONETIME;
    form.price = "-100";
    const errors = validatePublishForm(form);
    expect(errors.price).toBe("价格必须为非负数");
  });

  it("TC-408: 非整数价格返回 price 错误", () => {
    const form = validForm();
    form.pricingType = PricingType.SUBSCRIPTION;
    form.price = "99.5";
    const errors = validatePublishForm(form);
    expect(errors.price).toBe("价格必须为整数（分）");
  });

  it("TC-409: 免费定价时 price 为空也算有效", () => {
    const form = validForm();
    form.pricingType = PricingType.FREE;
    form.price = "";
    const errors = validatePublishForm(form);
    expect(errors.price).toBeUndefined();
  });

  it("TC-410: 非法版本号返回 version 错误", () => {
    const form = validForm();
    form.version = "v1.0";
    const errors = validatePublishForm(form);
    expect(errors.version).toBe("版本号格式 x.y.z");
  });

  it("TC-411: 非法 demoUrl 返回 demoUrl 错误", () => {
    const form = validForm();
    form.demoUrl = "not-a-url";
    const errors = validatePublishForm(form);
    expect(errors.demoUrl).toBe("URL 必须以 http(s):// 开头");
  });

  it("TC-412: 空 demoUrl 视为有效", () => {
    const form = validForm();
    form.demoUrl = "";
    const errors = validatePublishForm(form);
    expect(errors.demoUrl).toBeUndefined();
  });
});

describe("buildPublishPayload", () => {
  it("TC-413: 构造有效 payload，标签按逗号分隔", () => {
    const form = validForm();
    const payload = buildPublishPayload(
      "sess-123",
      ProductType.SOCIAL,
      form,
    );
    expect(payload).toEqual({
      sessionId: "sess-123",
      name: "AI 客服小助手",
      description:
        "基于 LLM 的智能客服回复组件，支持多轮对话与意图识别",
      category: StoreCategory.SOCIAL,
      productType: ProductType.SOCIAL,
      pricingType: PricingType.FREE,
      price: 0,
      tags: ["AI", "客服", "LLM"],
      version: "1.0.0",
      demoUrl: "https://lynxkit-abc123.aliyuncs.com",
    });
  });

  it("TC-414: 免费定价强制 price=0", () => {
    const form = validForm();
    form.pricingType = PricingType.FREE;
    form.price = "999"; // 即便填了，FREE 也要强制为 0
    const payload = buildPublishPayload(
      "sess-456",
      ProductType.SOCIAL,
      form,
    );
    expect(payload.price).toBe(0);
  });

  it("TC-415: 非免费定价用输入的 price 数值", () => {
    const form = validForm();
    form.pricingType = PricingType.ONETIME;
    form.price = "1990"; // 19.9 元 = 1990 分
    const payload = buildPublishPayload(
      "sess-789",
      ProductType.SOCIAL,
      form,
    );
    expect(payload.price).toBe(1990);
  });

  it("TC-416: 空标签字符串返回空数组", () => {
    const form = validForm();
    form.tags = "  ,  ,  ";
    const payload = buildPublishPayload(
      "sess",
      ProductType.SOCIAL,
      form,
    );
    expect(payload.tags).toEqual([]);
  });

  it("TC-417: 空 version 兜底为 1.0.0", () => {
    const form = validForm();
    form.version = "";
    const payload = buildPublishPayload(
      "sess",
      ProductType.SOCIAL,
      form,
    );
    expect(payload.version).toBe("1.0.0");
  });

  it("TC-418: 空 demoUrl 转为 undefined", () => {
    const form = validForm();
    form.demoUrl = "   ";
    const payload = buildPublishPayload(
      "sess",
      ProductType.SOCIAL,
      form,
    );
    expect(payload.demoUrl).toBeUndefined();
  });

  it("TC-419: 名称和描述被 trim", () => {
    const form = validForm();
    form.name = "  AI 助手  ";
    form.description = "  描述内容至少十个字符哦  ";
    const payload = buildPublishPayload(
      "sess",
      ProductType.SOCIAL,
      form,
    );
    expect(payload.name).toBe("AI 助手");
    expect(payload.description).toBe("描述内容至少十个字符哦");
  });
});
