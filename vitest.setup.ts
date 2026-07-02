/**
 * Vitest 全局 setup - LynxKit
 *
 * 在所有测试加载前设置测试环境变量。
 *
 * 必需性：apps/api/src/env.ts 在模块加载时用 Zod 严格校验 process.env，
 * 缺失必需变量会调用 process.exit(1) 终止进程，导致依赖 env 的模块（如
 * middleware/error.ts → env）无法在测试中被 import。此处统一注入测试值，
 * 让测试环境无需真实 .env 即可运行。
 *
 * 注意：
 *   - 此文件在 vitest.config.ts 的 setupFiles 中引用，先于任何测试文件加载
 *   - 仅设置"形状合法"的占位值，测试不会真实连接 DB / Redis / AI Provider
 *   - 若测试需要覆盖特定环境变量，仍可在测试内 vi.stubEnv() 单独覆盖
 */
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/lynxkit_test";
process.env.BETTER_AUTH_SECRET = "test-secret-at-least-32-characters-long-xxxx";
process.env.BETTER_AUTH_URL = "http://localhost:8787";
process.env.CORS_ORIGINS = "http://localhost:3000,http://localhost:5173";
process.env.KMS_MASTER_KEY = "0".repeat(64);
