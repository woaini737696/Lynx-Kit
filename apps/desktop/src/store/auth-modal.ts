/**
 * 桌面端认证弹窗 UI 状态
 *
 * 控制全屏液态玻璃 AuthModal 的开/关、当前视图（login/register）、
 * 以及登录成功后需要跳回的"原目标路径"（由 ProtectedRoute 写入，
 * AuthModal 在登录成功后读取并 navigate）。
 *
 * 仅桌面端本地状态（web/mobile 各自的认证流程不同），不入 @lynxkit/store。
 */
import { create } from "zustand";

export type AuthModalView = "login" | "register";

interface AuthModalState {
  /** 弹窗是否打开 */
  open: boolean;
  /** 当前视图：登录 / 注册 */
  view: AuthModalView;
  /**
   * 登录成功后需要跳转的目标路径。
   * 由 ProtectedRoute 在拦截未登录访问时写入；
   * AuthModal 登录成功后读取并 navigate，跳转完成后由 closeAuthModal 清空。
   */
  intendedPath: string | null;
  /** 打开弹窗；可同时切换视图与携带目标路径 */
  openAuthModal: (view?: AuthModalView, intendedPath?: string | null) => void;
  /** 关闭弹窗；清空 intendedPath 但保留 view（延续用户选择） */
  closeAuthModal: () => void;
  /** 在弹窗内切换视图（login ↔ register） */
  setView: (view: AuthModalView) => void;
}

export const useAuthModal = create<AuthModalState>((set) => ({
  open: false,
  view: "login",
  intendedPath: null,
  openAuthModal: (view = "login", intendedPath = null) =>
    set({ open: true, view, intendedPath }),
  closeAuthModal: () => set({ open: false, intendedPath: null }),
  setView: (view) => set({ view }),
}));
