/**
 * @lynxkit/store - 跨端共享 Zustand stores
 *
 * 为 LynxKit 三端（Desktop / Mobile / Web）提供共享业务状态管理。
 * 持久化 store 通过 persist 中间件 + createJSONStorage 落地到 localStorage，
 * 在 RN 中通过文件顶部的 safeStorage 降级为内存存储，需由宿主 App 补齐 polyfill。
 */

export * from "./auth-store";
export * from "./build-store";
export * from "./ui-store";
export * from "./ai-config-store";
export * from "./store-store";
