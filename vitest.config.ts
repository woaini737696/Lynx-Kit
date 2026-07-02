/**
 * LynxKit monorepo 根级 Vitest 配置
 *
 * - 支持 TS path mapping（@lynxkit/* 别名）
 * - 覆盖所有 packages/* 与 apps/* 的测试
 * - coverage 阈值待后续迭代补齐
 */
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@lynxkit/shared": resolve(__dirname, "packages/shared/src/index.ts"),
      "@lynxkit/shared/*": resolve(__dirname, "packages/shared/src"),
      "@lynxkit/db": resolve(__dirname, "packages/db/src/index.ts"),
      "@lynxkit/db/*": resolve(__dirname, "packages/db/src"),
      "@lynxkit/store": resolve(__dirname, "packages/store/src/index.ts"),
      "@lynxkit/store/*": resolve(__dirname, "packages/store/src"),
      "@lynxkit/api-client": resolve(__dirname, "packages/api-client/src/index.ts"),
      "@lynxkit/api-client/*": resolve(__dirname, "packages/api-client/src"),
      "@lynxkit/agent-core": resolve(__dirname, "packages/agent-core/src/index.ts"),
      "@lynxkit/agent-core/*": resolve(__dirname, "packages/agent-core/src"),
      "@lynxkit/ui-web": resolve(__dirname, "packages/ui-web/src/index.ts"),
      "@lynxkit/ui-web/*": resolve(__dirname, "packages/ui-web/src"),
    },
  },
  test: {
    include: ["packages/**/src/**/*.test.ts", "apps/**/src/**/*.test.ts"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.turbo/**",
      "**/release/**",
      "**/out/**",
    ],
    environment: "node",
    globals: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["**/*.test.ts", "**/*.spec.ts", "**/node_modules/**", "**/dist/**"],
    },
  },
});
