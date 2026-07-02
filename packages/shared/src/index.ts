/**
 * @lynxkit/shared - 跨端共享层
 *
 * 包含：Zod schema / TS 类型 / 常量 / 工具 / 加密抽象
 * 跨端复用：Desktop (Electron) / Mobile (Expo) / Web (Next.js) / API (Hono)
 */

// ============ Types ============
export * from "./types/index";

// ============ Constants ============
export * from "./constants/index";

// ============ Utils ============
export * from "./utils/index";

// NOTE: Crypto (KMS) 模块已从主入口移除，避免在客户端引入 node:crypto。
// 服务端如需 KMS，请从 "@lynxkit/shared/crypto" 子路径导入（需配置 package.json exports）。

// ============ Zod Schemas ============
export * from "./schemas/index";
