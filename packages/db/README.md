# @lynxkit/db

LynxKit 平台数据库层 - 基于 Drizzle ORM 的 PostgreSQL schema + 客户端工厂。

## 功能

- 11 张核心表（用户 / 服务器 / 构建会话 / 商店 / 创作者 / 系统）
- 11 个 PostgreSQL 枚举（pgEnum）
- pgvector 支持（embeddings 自定义类型）
- 复合索引（user_id + status + created_at）
- RLS（行级安全）启用注释
- 客户端工厂同时支持本地 PG 与 Neon serverless

## 用法

```ts
import { createDb, schema } from "@lynxkit/db";

const db = createDb({ url: process.env.DATABASE_URL! });
const user = await db.select().from(schema.users);
```

## 脚本

| 命令 | 说明 |
|------|------|
| `pnpm generate` | 生成 SQL 迁移 |
| `pnpm migrate` | 应用迁移 |
| `pnpm push` | 直接推送 schema（开发用） |
| `pnpm studio` | 打开 Drizzle Studio |
| `pnpm typecheck` | TypeScript 类型检查 |

## 数据源

通过 `createDb(env)` 工厂自动选择驱动：

- `DATABASE_URL` 以 `postgresql://` 开头且非 Neon → 使用 `pg` 驱动（本地 / 自建 PG）
- `DATABASE_URL` 以 `postgresql://` 且 host 含 `neon.tech` → 使用 `@neondatabase/serverless` HTTP 驱动
