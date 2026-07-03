/**
 * 数据库迁移执行器
 *
 * 流程：
 *   1. 确保 pgvector 扩展已安装（CREATE EXTENSION IF NOT EXISTS vector）
 *   2. 执行 drizzle-kit 生成的迁移文件
 *
 * 用法：DATABASE_URL=... pnpm --filter @lynxkit/db run-migrate
 *
 * 注意：此脚本在本地或 CI 运行，不在服务器运行（服务器零构建约束）。
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { resolve } from "node:path";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/lynxkit";

const MIGRATIONS_FOLDER = resolve(import.meta.dirname, "../drizzle");

async function main() {
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    // 1. 确保 pgvector 扩展已安装
    await client.query("CREATE EXTENSION IF NOT EXISTS vector");
    console.log("✓ pgvector 扩展已就绪");

    // 2. 执行 drizzle 迁移
    const db = drizzle(client);
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
    console.log("✓ 数据库迁移完成");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("✗ 迁移失败：", err);
  process.exit(1);
});
