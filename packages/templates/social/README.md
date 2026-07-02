# social 模板 — AI 社交产品

> LynxKit 6 大预设架构之外的首批 **AI-native 模板**（Week 1 首发，SOCIAL 类型）。

本模板用于生成 AI 社交产品（智能匹配 + 实时聊天 + AI 助手），9 层 Agent 会基于此模板填充业务逻辑。

## 目录结构

```
social/
├── template.json      # 模板元数据 + 需求澄清问题（驱动 config.ts）
├── scaffold/          # 脚手架（生成的初始项目结构）
│   ├── package.json   # workspace 根
│   ├── apps/web/      # Next.js 15 前端（Tailwind + shadcn/ui）
│   └── server/        # Hono.js 后端（Drizzle + WebSocket）
├── schema.ts          # 用户产品库 Drizzle schema 模板（users/matches/conversations/messages/icebreakers）
├── components.ts      # 核心组件清单（MatchCard/ChatBubble/IcebreakerSuggest...）
├── questions.ts       # 需求澄清问题（5-8 个，type: single/multiple/text/boolean）
├── features.ts       # 功能特性清单（auth/match/chat/ai_icebreaker/sentiment...）
└── README.md          # 本文件
```

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | Next.js 15、Tailwind CSS、shadcn/ui |
| 后端 | Hono.js、Node.js |
| 数据库 | PostgreSQL + pgvector（向量检索做兴趣匹配） |
| 实时 | WebSocket |
| AI | DeepSeek-V3（对话/破冰/情感）、text-embedding-3-large（兴趣向量） |
| 部署 | Vercel 或 Docker Compose |

## 占位符约定

`scaffold/` 下所有文件均带 `{{VARIABLE}}` 占位符（如 `{{APP_NAME}}`、`{{THEME_COLOR}}`、`{{API_BASE_URL}}`），
9 层 Agent 在生成用户产品时会替换为实际值。占位符也提供默认值，模板本身可直接 `pnpm install && pnpm dev` 运行。

| 占位符 | 默认值 | 说明 |
|--------|--------|------|
| `{{APP_NAME}}` | `Lynx Social` | 用户产品名 |
| `{{THEME_COLOR}}` | `#FF6B35` | 主题色（来自问题 `theme`） |
| `{{API_BASE_URL}}` | `http://localhost:8787` | 后端 Hono 地址 |
| `{{DATABASE_URL}}` | `postgresql://postgres:postgres@localhost:5432/social` | 产品库连接串 |
| `{{AI_API_KEY}}` | `` | DeepSeek / OpenAI 兼容 key |
| `{{AI_BASE_URL}}` | `https://api.deepseek.com` | AI 推理地址 |

## 与 `_base` 的关系

- `_base/` 公共基础（UI 组件、auth、layout、lib）保留，social 模板通过 `@/_base/components/*` 引用
- social 模板新增的 ChatBubble / MatchCard / IcebreakerSuggest 等组件位于 `apps/web/src/components/social/`
- 数据库使用 Drizzle ORM（schema 见 `../schema.ts`），与 `_base` 的 Prisma 基座不冲突

## 9 层 Agent 如何使用本模板

1. **需求澄清层** 读取 `template.json` 中的 `questions`，向用户提问并生成 `config.ts`
2. **架构层** 基于 `scaffold/` 复制初始项目结构
3. **Schema 层** 基于顶层 `schema.ts` 生成用户产品库迁移
4. **生成层** 基于 `components.ts` / `features.ts` 选择性生成业务组件与功能模块
5. **集成层** 在 `apps/web` 与 `server` 之间打通 API / WebSocket 调用

## 启动

```bash
cd scaffold
pnpm install
# 启动后端
pnpm --filter server dev
# 启动前端
pnpm --filter web dev
```

详见 `scaffold/README.md`。
