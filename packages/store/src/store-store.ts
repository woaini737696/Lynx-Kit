import { create } from "zustand";

type StoreSortBy = "popular" | "newest" | "price_asc" | "price_desc";

interface StoreState {
  /** 搜索关键词 */
  query: string;
  /** 分类筛选（null 表示不限） */
  category: string | null;
  /** 排序方式 */
  sortBy: StoreSortBy;
  setQuery: (q: string) => void;
  setCategory: (c: string | null) => void;
  setSortBy: (s: StoreSortBy) => void;
  reset: () => void;
}

export const useStoreStore = create<StoreState>()((set) => ({
  query: "",
  category: null,
  sortBy: "popular",
  setQuery: (q) => set({ query: q }),
  setCategory: (c) => set({ category: c }),
  setSortBy: (s) => set({ sortBy: s }),
  reset: () => set({ query: "", category: null, sortBy: "popular" }),
}));
