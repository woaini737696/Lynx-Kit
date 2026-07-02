import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../schema";

/**
 * Drizzle 客户端
 * - DATABASE_URL 由 9 层 Agent 替换为用户产品库实际连接串
 * - schema 引用上层 schema.ts（用户产品库结构）
 *
 * 注意：模板路径下 schema.ts 在 ../schema.ts；当 scaffold 被复制到用户项目时，
 * 9 层 Agent 会调整相对路径或改为 alias 引用。
 */
const DATABASE_URL =
  process.env.DATABASE_URL ?? "{{DATABASE_URL}}";

const queryClient = postgres(DATABASE_URL, { max: 10 });

export const db = drizzle(queryClient, { schema });

export { schema };
