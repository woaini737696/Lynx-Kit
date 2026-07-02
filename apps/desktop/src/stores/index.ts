/**
 * 本地 stores - 重新导出 @lynxkit/store
 *
 * 桌面端所有业务状态（auth / build / ui / ai-config / store）统一从
 * @lynxkit/store 复用，确保三端状态结构一致。持久化 store 落地到 localStorage。
 */
export {
  useAuthStore,
  useBuildStore,
  useUIStore,
  useAIConfigStore,
  useStoreStore,
} from "@lynxkit/store";
