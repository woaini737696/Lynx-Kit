import { resolve } from "node:path";
/**
 * LynxKit monorepo 根级 Vitest 配置
 *
 * - 支持 TS path mapping（@lynxkit/* 别名）
 * - 覆盖所有 packages/* 与 apps/* 的测试
 * - 渐进式覆盖率门槛（v1.2 起步 5%，目标 60%）
 *   - 迭代 17：5%（防止下降）
 *   - 迭代 19：20%
 *   - 迭代 21：60%
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@lynxkit/shared": resolve(__dirname, "packages/shared/src/index.ts"),
			"@lynxkit/shared/*": resolve(__dirname, "packages/shared/src"),
			"@lynxkit/db": resolve(__dirname, "packages/db/src/index.ts"),
			"@lynxkit/db/*": resolve(__dirname, "packages/db/src"),
			"@lynxkit/store": resolve(__dirname, "packages/store/src/index.ts"),
			"@lynxkit/store/*": resolve(__dirname, "packages/store/src"),
			"@lynxkit/api-client": resolve(
				__dirname,
				"packages/api-client/src/index.ts",
			),
			"@lynxkit/api-client/*": resolve(__dirname, "packages/api-client/src"),
			"@lynxkit/agent-core": resolve(
				__dirname,
				"packages/agent-core/src/index.ts",
			),
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
			"**/.next/**",
			"**/.turbo/**",
			"**/release/**",
			"**/release-*/**",
			"**/out/**",
			"**/coverage/**",
		],
		environment: "node",
		globals: false,
		setupFiles: ["./vitest.setup.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "text-summary", "lcov"],
			exclude: [
				"**/*.test.ts",
				"**/*.spec.ts",
				"**/node_modules/**",
				"**/dist/**",
				"**/.next/**",
				"**/.turbo/**",
				"**/coverage/**",
				"**/*.config.ts",
				"**/*.config.mjs",
				"**/*.config.js",
				"**/types.ts",
				"**/index.ts",
				"**/scripts/**",
				"**/deploy/**",
				"**/*.d.ts",
			],
			thresholds: {
				// 渐进式提升：迭代 17 = 3%（略低于当前 3.24%，防止下降）
				// 后续目标：迭代 19 = 20%，迭代 21 = 60%
				lines: 3,
				functions: 15,
				branches: 40,
				statements: 3,
			},
		},
	},
});
