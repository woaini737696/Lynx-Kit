/**
 * 移动端个人资料表单纯逻辑测试（TDD：RED 阶段）
 *
 * 测试目标：apps/mobile/src/lib/profile-form.ts
 * 覆盖范围：validateProfileForm / buildProfilePatch
 */
import { describe, it, expect } from "vitest";
import {
  validateProfileForm,
  buildProfilePatch,
  type ProfileFormState,
} from "./profile-form";

describe("validateProfileForm", () => {
  it("TC-501: 全空表单返回无错误（name/phone 都可选）", () => {
    const errors = validateProfileForm({ name: "", phone: "" });
    expect(errors).toEqual({});
  });

  it("TC-502: 用户名过短返回 name 错误", () => {
    const errors = validateProfileForm({ name: "A", phone: "" });
    expect(errors.name).toBe("用户名至少 2 字");
  });

  it("TC-503: 用户名过长返回 name 错误", () => {
    const errors = validateProfileForm({
      name: "一".repeat(33),
      phone: "",
    });
    expect(errors.name).toBe("用户名最多 32 字");
  });

  it("TC-504: 非法手机号返回 phone 错误", () => {
    const errors = validateProfileForm({ name: "", phone: "12345" });
    expect(errors.phone).toBe("手机号格式错误（11 位）");
  });

  it("TC-505: 合法 11 位手机号通过校验", () => {
    const errors = validateProfileForm({ name: "", phone: "13800138000" });
    expect(errors.phone).toBeUndefined();
  });

  it("TC-506: 空手机号通过校验（可选）", () => {
    const errors = validateProfileForm({ name: "", phone: "" });
    expect(errors.phone).toBeUndefined();
  });

  it("TC-507: 以 0 开头的手机号非法", () => {
    const errors = validateProfileForm({
      name: "",
      phone: "013800138000",
    });
    expect(errors.phone).toBe("手机号格式错误（11 位）");
  });

  it("TC-508: 合法用户名通过校验", () => {
    const errors = validateProfileForm({
      name: "张三丰",
      phone: "",
    });
    expect(errors.name).toBeUndefined();
  });
});

describe("buildProfilePatch", () => {
  const currentUser = { name: "旧昵称", phone: "13800138000" };

  it("TC-509: 无任何变化返回空 patch", () => {
    const patch = buildProfilePatch(
      { name: "旧昵称", phone: "13800138000" },
      currentUser,
    );
    expect(patch).toEqual({});
    expect(Object.keys(patch)).toHaveLength(0);
  });

  it("TC-510: name 变化时返回 name 字段", () => {
    const patch = buildProfilePatch(
      { name: "新昵称", phone: "13800138000" },
      currentUser,
    );
    expect(patch).toEqual({ name: "新昵称" });
  });

  it("TC-511: phone 变化时返回 phone 字段", () => {
    const patch = buildProfilePatch(
      { name: "旧昵称", phone: "13900139000" },
      currentUser,
    );
    expect(patch).toEqual({ phone: "13900139000" });
  });

  it("TC-512: 清空手机号返回 phone=undefined", () => {
    const patch = buildProfilePatch(
      { name: "旧昵称", phone: "" },
      currentUser,
    );
    expect(patch).toEqual({ phone: undefined });
  });

  it("TC-513: name 两侧空格被 trim 后比较", () => {
    const patch = buildProfilePatch(
      { name: "  旧昵称  ", phone: "13800138000" },
      currentUser,
    );
    expect(patch).toEqual({});
  });

  it("TC-514: trim 后 name 仍变化时返回 trim 后的值", () => {
    const patch = buildProfilePatch(
      { name: "  新昵称  ", phone: "13800138000" },
      currentUser,
    );
    expect(patch).toEqual({ name: "新昵称" });
  });

  it("TC-515: 当前用户无 name，表单填入新 name 返回 patch", () => {
    const patch = buildProfilePatch(
      { name: "首次昵称", phone: "" },
      { name: undefined, phone: undefined },
    );
    expect(patch).toEqual({ name: "首次昵称" });
  });

  it("TC-516: 表单 name 为空且当前用户无 name 时不返回 patch", () => {
    const patch = buildProfilePatch(
      { name: "", phone: "" },
      { name: undefined, phone: undefined },
    );
    expect(patch).toEqual({});
  });
});
