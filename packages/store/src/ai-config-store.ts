import { create } from "zustand";
import {
  persist,
  createJSONStorage,
  type StateStorage,
} from "zustand/middleware";
import type { AIProvider, AIModelConfig } from "@lynxkit/shared";

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

interface AIConfigState {
  /** 用户配置的各 Provider */
  configs: Partial<Record<AIProvider, AIModelConfig>>;
  activeProvider: AIProvider | null;
  setConfig: (provider: AIProvider, cfg: AIModelConfig) => void;
  removeConfig: (provider: AIProvider) => void;
  setActive: (provider: AIProvider) => void;
}

export const useAIConfigStore = create<AIConfigState>()(
  persist(
    (set) => ({
      configs: {},
      activeProvider: null,
      setConfig: (provider, cfg) =>
        set((s) => ({ configs: { ...s.configs, [provider]: cfg } })),
      removeConfig: (provider) =>
        set((s) => {
          const configs = { ...s.configs };
          delete configs[provider];
          return {
            configs,
            activeProvider:
              s.activeProvider === provider ? null : s.activeProvider,
          };
        }),
      setActive: (provider) => set({ activeProvider: provider }),
    }),
    { name: "lynxkit-ai-config", storage: createJSONStorage(safeStorage) }
  )
);
