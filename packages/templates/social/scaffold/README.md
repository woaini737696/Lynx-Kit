# {{APP_NAME}}

> AI 社交产品 — 由 LynxKit `social` 模板生成。
> 智能匹配（pgvector）+ 实时聊天（WebSocket）+ AI 破冰助手（DeepSeek-V3）。

## 目录结构

```
.
├── apps/
│   └── web/                # Next.js 15 前端（Tailwind + shadcn/ui）
│       └── src/app/
│           ├── layout.tsx
│           ├── page.tsx                  # 首页（登录后跳 /discover）
│           ├── (auth)/                  # 登录 / 注册
│           ├── (chat)/                   # 聊天列表 / [userId] 详情
│           ├── (profile)/               # 个人资料
│           └── (discover)/              # 发现 / 匹配
└── server/                # Hono.js 后端
    └── src/
        ├── index.ts                      # Hono 入口
        ├── routes/                       # auth / match / chat / profile / ai
        └── lib/                          # db (Drizzle) / ai (DeepSeek 封装)
```

## 占位符

模板中所有 `{{VARIABLE}}` 占位符在 9 层 Agent 生成时替换为实际值。
默认值保证模板可直接运行，无需预先填写。

| 占位符 | 默认值 |
|--------|--------|
| `{{APP_NAME}}` | `Lynx Social` |
| `{{THEME_COLOR}}` | `#FF6B35` |
| `{{API_BASE_URL}}` | `http://localhost:8787` |
| `{{DATABASE_URL}}` | `postgresql://postgres:postgres@localhost:5432/social` |
| `{{AI_API_KEY}}` | (空) |
| `{{AI_BASE_URL}}` | `https://api.deepseek.com` |

## 启动

### 1. 准备 PostgreSQL + pgvector

```bash
# 推荐使用 docker-compose 启动（含 pgvector）
docker run -d --name social-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=social \
  -p 5432:5432 \
  pgvector/pgvector:pg16
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 推送数据库 schema

```bash
pnpm db:push
```

### 4. 启动后端

```bash
pnpm dev:server
# → http://localhost:8787
```

### 5. 启动前端

```bash
pnpm dev
# → http://localhost:3000
```

## 开发

- 前端：`apps/web/src/app/*` — 路由组 `(auth)` `(chat)` `(profile)` `(discover)` 已按 social 产品结构划分
- 后端：`server/src/routes/*` — 每个领域一个路由文件，Hono 实例统一在 `index.ts` 装配
- AI：`server/src/lib/ai.ts` — DeepSeek/OpenAI 兼容封装，可切换 provider
- 实时：`server/src/routes/chat.ts` 暴露 `/ws` WebSocket，按 `conversationId` 路由消息
