/**
 * auth-modal 状态 store 测试（TDD：RED 阶段）
 *
 * 测试目标：apps/desktop/src/store/auth-modal.ts
 * 覆盖范围：
 *   - 默认状态（关闭 + view=login）
 *   - openAuthModal(view, intendedPath?)
 *   - closeAuthModal()
 *   - setView(view)
 *   - intendedPath 在登录成功后由调用方读取并跳转
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useAuthModal } from "./auth-modal";

describe("useAuthModal", () => {
  beforeEach(() => {
    // 每个用例前重置为初始状态
    useAuthModal.setState({ open: false, view: "login", intendedPath: null });
  });

  it("TC-AM-01: 初始状态为关闭 + login 视图 + 无 intendedPath", () => {
    const s = useAuthModal.getState();
    expect(s.open).toBe(false);
    expect(s.view).toBe("login");
    expect(s.intendedPath).toBeNull();
  });

  it("TC-AM-02: openAuthModal('login') 打开弹窗并保持默认 view", () => {
    useAuthModal.getState().openAuthModal("login");
    const s = useAuthModal.getState();
    expect(s.open).toBe(true);
    expect(s.view).toBe("login");
  });

  it("TC-AM-03: openAuthModal('register') 打开弹窗并切换到 register 视图", () => {
    useAuthModal.getState().openAuthModal("register");
    const s = useAuthModal.getState();
    expect(s.open).toBe(true);
    expect(s.view).toBe("register");
  });

  it("TC-AM-04: openAuthModal 携带 intendedPath 时存储原路径", () => {
    useAuthModal.getState().openAuthModal("login", "/build");
    expect(useAuthModal.getState().intendedPath).toBe("/build");
  });

  it("TC-AM-05: openAuthModal 不传 intendedPath 时清空原值", () => {
    useAuthModal.getState().openAuthModal("login", "/build");
    useAuthModal.getState().openAuthModal("register");
    expect(useAuthModal.getState().intendedPath).toBeNull();
  });

  it("TC-AM-06: setView 在弹窗打开时切换 login ↔ register", () => {
    useAuthModal.getState().openAuthModal("login");
    useAuthModal.getState().setView("register");
    expect(useAuthModal.getState().view).toBe("register");
    useAuthModal.getState().setView("login");
    expect(useAuthModal.getState().view).toBe("login");
  });

  it("TC-AM-07: closeAuthModal 关闭弹窗并清空 intendedPath，但保留 view", () => {
    useAuthModal.getState().openAuthModal("register", "/build");
    useAuthModal.getState().closeAuthModal();
    const s = useAuthModal.getState();
    expect(s.open).toBe(false);
    expect(s.intendedPath).toBeNull();
    // 保留 view 以便下次打开时延续用户选择
    expect(s.view).toBe("register");
  });
});
