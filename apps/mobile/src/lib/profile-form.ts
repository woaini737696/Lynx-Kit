/**
 * 移动端个人资料表单纯逻辑（TDD：GREEN 实现）
 *
 * 把"填表 → 校验 → 提交 patch"从组件中抽离为纯函数，
 * 便于在 node 环境下进行单元测试。
 *
 * 设计要点：
 * - name / phone 都可选（用户可只改一个）
 * - name 长度 2-32 字符
 * - phone 校验中国大陆 11 位手机号格式
 * - buildProfilePatch 只返回真正变化的字段，避免空值覆盖
 */
export interface ProfileFormState {
  name: string;
  phone: string;
}

export type ProfileFormErrors = Partial<
  Record<keyof ProfileFormState, string>
>;

/**
 * 校验个人资料表单，返回错误映射（空对象表示通过）。
 */
export function validateProfileForm(
  form: ProfileFormState,
): ProfileFormErrors {
  const errors: ProfileFormErrors = {};

  const trimmedName = form.name.trim();
  if (trimmedName.length > 0 && trimmedName.length < 2) {
    errors.name = "用户名至少 2 字";
  } else if (trimmedName.length > 32) {
    errors.name = "用户名最多 32 字";
  }

  if (form.phone) {
    // 中国大陆 11 位手机号：1 开头，第二位 3-9
    if (!/^1[3-9]\d{9}$/.test(form.phone)) {
      errors.phone = "手机号格式错误（11 位）";
    }
  }

  return errors;
}

/**
 * 根据表单状态与当前用户信息构造 patch 对象。
 *
 * - 只返回真正变化的字段
 * - name 两侧空格被 trim
 * - 清空 phone 时返回 phone=undefined（表示删除）
 * - 无变化返回空对象
 */
export function buildProfilePatch(
  form: ProfileFormState,
  currentUser: { name?: string; phone?: string },
): { name?: string; phone?: string } {
  const patch: { name?: string; phone?: string } = {};

  const trimmedName = form.name.trim();
  const currentName = currentUser.name ?? "";
  if (trimmedName && trimmedName !== currentName) {
    patch.name = trimmedName;
  }

  const currentPhone = currentUser.phone ?? "";
  if (form.phone !== currentPhone) {
    patch.phone = form.phone || undefined;
  }

  return patch;
}
