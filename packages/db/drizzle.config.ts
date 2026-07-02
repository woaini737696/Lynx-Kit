import { defineConfig } from "drizzle-kit";

/**
 * drizzle-kit 配置
 *
 * - 生成迁移：pnpm --filter @lynxkit/db generate
 * - 应用迁移：pnpm --filter @lynxkit/db migrate
 * - 推送 schema：pnpm --filter @lynxkit/db push
 * - 打开 Studio：pnpm --filter @lynxkit/db studio
 *
 * DATABASE_URL 通过环境变量传入，支持本地 PG 和 Neon serverless。
 */
export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/lynxkit",
  },
  verbose: true,
  strict: true,
});
