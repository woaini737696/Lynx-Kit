import { create } from "zustand";
import {
  persist,
  createJSONStorage,
  type StateStorage,
} from "zustand/middleware";

// 跨端兼容：RN 中无 localStorage，降级为内存存储（仅本会话有效）
const safeStorage = (): StateStorage => {
  if (typeof localStorage !== "undefined") {
    return localStorage;
  }
  const mem = new Map<string, string>();
  return {
    getItem: (k) => mem.get(k) ?? null,
    setItem: (k, v) => void mem.set(k, v),
    removeItem: (k) => void mem.delete(k),
  };
};

type Theme = "light" | "dark" | "system";

interface UIState {
  theme: Theme;
  sidebarOpen: boolean;
  /** 表单草稿（key -> 内容），如灵感输入框临时内容 */
  drafts: Record<string, string>;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setDraft: (key: string, content: string) => void;
  clearDraft: (key: string) => void;
  clearDrafts: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: "light",
      sidebarOpen: true,
      drafts: {},
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setDraft: (key, content) =>
        set((s) => ({ drafts: { ...s.drafts, [key]: content } })),
      clearDraft: (key) =>
        set((s) => {
          const drafts = { ...s.drafts };
          delete drafts[key];
          return { drafts };
        }),
      clearDrafts: () => set({ drafts: {} }),
    }),
    { name: "lynxkit-ui", version: 2, storage: createJSONStorage(safeStorage) }
  )
);
