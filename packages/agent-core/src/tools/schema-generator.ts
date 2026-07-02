/**
 * Drizzle schema 生成器 - LynxKit agent-core
 *
 * 把 PM Agent 产出的 dataModels 转换为 Drizzle ORM 的 schema 文件内容。
 * 同时导出 AI SDK tool 定义，供 tool calling 使用。
 */

import { tool } from "ai";
import { z } from "zod";

/**
 * 单个数据模型字段（与 PM prompt 输出对齐）
 */
export interface DataModelField {
  name: string;
  type: string;
  primaryKey: boolean;
  nullable: boolean;
}

/**
 * PM 产出的数据模型
 */
export interface DataModel {
  table: string;
  fields: DataModelField[];
}

/** Drizzle 类型映射表：PM 类型 → Drizzle pg-core 调用 */
const DRIZZLE_TYPE_MAP: Record<string, string> = {
  uuid: 'uuid("{col}").defaultRandom()',
  varchar: 'varchar("{col}", { length: {len} })',
  text: 'text("{col}")',
  integer: 'integer("{col}")',
  boolean: 'boolean("{col}").default(false)',
  timestamp: 'timestamp("{col}").defaultNow()',
  jsonb: 'jsonb("{col}")',
};

/**
 * 将单个 Drizzle 类型描述映射为 pg-core 调用字符串
 */
function mapField(field: DataModelField): string {
  const raw = field.type.toLowerCase();
  if (raw.startsWith("varchar")) {
    const lenMatch = raw.match(/\((\d+)\)/);
    const len = lenMatch?.[1] ?? "255";
    const tmpl = DRIZZLE_TYPE_MAP.varchar;
    if (!tmpl) return `varchar("${field.name}", { length: ${len} })`;
    return tmpl.replace("{col}", field.name).replace("{len}", len);
  }
  const base = raw.split("(")[0] ?? raw;
  const tmpl = DRIZZLE_TYPE_MAP[base];
  if (!tmpl) return `varchar("${field.name}", { length: 255 })`;
  return tmpl.replace("{col}", field.name);
}

/**
 * 生成 Drizzle schema 文件内容
 */
export function generateDrizzleSchema(models: DataModel[]): string {
  const tables = models.map((m) => {
    const fieldLines = m.fields.map((f) => {
      const expr = mapField(f);
      const pk = f.primaryKey ? ".primaryKey()" : "";
      const nullable = !f.nullable && !f.primaryKey ? ".notNull()" : "";
      return `  ${f.name}: ${expr}${pk}${nullable},`;
    });
    return `export const ${m.table} = pgTable("${m.table}", {\n${fieldLines.join("\n")}\n});`;
  });

  return [
    `import { pgTable, uuid, varchar, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";`,
    ``,
    tables.join("\n\n"),
    ``,
  ].join("\n");
}

/**
 * AI SDK tool 定义：生成 Drizzle schema
 */
export function createSchemaGeneratorTool() {
  return tool({
    description: "根据数据模型清单生成 Drizzle ORM schema 文件内容",
    inputSchema: z.object({
      models: z
        .array(
          z.object({
            table: z.string(),
            fields: z.array(
              z.object({
                name: z.string(),
                type: z.string(),
                primaryKey: z.boolean(),
                nullable: z.boolean(),
              }),
            ),
          }),
        )
        .describe("数据模型清单（来自 PM Agent）"),
    }),
    execute: async ({ models }) => {
      const schema = generateDrizzleSchema(models);
      return { schema, tables: models.map((m) => m.table) };
    },
  });
}
