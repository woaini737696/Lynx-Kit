<div align="center">

# LynxKit

<!-- logo 占位：替换为实际 logo 路径 -->
<!-- <img src="docs/assets/logo.png" width="200" alt="LynxKit Logo" /> -->

**AI 时代，人人都是造物主。**

基于自然语言描述，9 层 Agent 协作开发完整 AI 产品，一键部署上架 AI 应用商店。

[![CI](https://github.com/lynxkit/lynxkit/actions/workflows/ci.yml/badge.svg)](https://github.com/lynxkit/lynxkit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 核心特性

- 🧠 **9 层 Agent 编排引擎** —— 意图识别、架构设计、需求澄清、产品经理、设计师、前端、后端、AI 集成、测试修复、部署，全自动协作。
- 🗣️ **自然语言驱动** —— 用户只描述需求，平台自动选模板、生成代码、编译验证、部署上线。
- 🖥️ **跨端覆盖** —— Electron 桌面端 + Expo 移动端 + Next.js Web 端，一套类型契约贯穿。
- 🤖 **国内 6 大模型接入** —— DeepSeek / Kimi / 豆包 / 通义千问 / GLM / MiMo，开箱即用。
- 🔐 **企业级安全** —— Better Auth 鉴权 + LocalKMS（AES-256-GCM）加密 + Docker 沙箱构建隔离。
- 🚀 **一键部署上架** —— SSH + Docker Compose + Caddy 自动 SSL，产物直达 AI 应用商店。

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面端 | Electron 30 + Next.js 15 + React 19 + shadcn/ui |
| 移动端 | Expo（React Native） |
| Web 端 | Next.js 15 App Router + React 19 + Tailwind + Serwist（PWA） |
| 后端 API | Hono（Cloudflare Workers / Node.js）+ tRPC |
| 数据层 | Drizzle ORM + PostgreSQL 16（pgvector）+ Redis 7 |
| AI 编排 | Vercel AI SDK 5.0 + 9 层 Agent + 工具调用 |
| 鉴权 | Better Auth（JWT / OAuth / 邮箱魔法链接） |
| AI 模型 | DeepSeek · Kimi · 豆包 · 通义千问 · GLM · MiMo（国内 6 大模型） |
| 加密 | LocalKMS（AES-256-GCM），可替换云 KMS |
| 部署 | NodeSSH + Docker Compose + Caddy（自动 SSL） |
| Monorepo | pnpm workspace + Turborepo |

## 快速开始

### 环境要求

- Node.js ≥ 20.14
- pnpm ≥ 9.12
- Docker Desktop（用于本地数据库与构建沙箱）

### 1. 安装依赖

```bash
pnpm install
```

### 2. 启动本地基础设施

```bash
docker compose -f docker-compose.dev.yml up -d
# 包含 PostgreSQL 16 (pgvector) + Redis 7 + MinIO
```

### 3. 配置环境变量

```bash
cp .env.example .env
# 填入 AI 模型 Key、数据库连接、加密密钥等
```

### 4. 初始化数据库

```bash
pnpm db:push      # 推送 schema
# 或 pnpm db:migrate
```

### 5. 启动开发服务

```bash
pnpm dev          # 通过 Turborepo 并行启动所有应用
```

亦可按需单独启动：

```bash
pnpm --filter @lynxkit/api dev       # 后端 API
pnpm --filter @lynxkit/web dev       # Web 端
pnpm --filter @lynxkit/desktop dev   # 桌面端
```

## 项目结构

```
LynxKit/
├── apps/
│   ├── api/          # 后端 API（Hono + tRPC + Drizzle）
│   ├── web/          # Web 端 + 落地页 + PWA（Next.js 15）
│   ├── desktop/      # 桌面端（Electron + Next.js）
│   └── mobile/       # 移动端（Expo）
├── packages/
│   ├── shared/       # 共享类型 + Zod schema + KMS 加密
│   ├── agent-core/   # 9 层 Agent 编排引擎 + LLM Provider
│   ├── db/           # Drizzle ORM schema 与数据库客户端
│   ├── deployer/     # 部署模块（SSH / Docker / Caddy / 沙箱）
│   ├── api-client/   # 端到端类型安全 API 客户端
│   ├── store/        # Zustand 状态管理
│   ├── ui-web/       # shadcn/ui 组件库
│   └── templates/    # 6 类产品模板基座
├── docker-compose.dev.yml
├── turbo.json
├── pnpm-workspace.yaml
└── .env.example
```

## 开发指南

```bash
pnpm dev          # 启动所有应用开发服务
pnpm build        # 构建所有包
pnpm lint         # 代码检查
pnpm typecheck    # 类型检查
pnpm test         # 运行测试
pnpm clean        # 清理构建产物
pnpm db:studio    # Drizzle Studio 可视化数据库
```

CI 流水线（`.github/workflows/ci.yml`）会依次执行 `lint → typecheck → test → build`，提交前请确保本地通过。

## 环境变量

完整变量清单见 [.env.example](./.env.example)，主要包含：

- `DATABASE_URL` / `REDIS_URL` —— 数据库与缓存连接
- `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL` —— 鉴权密钥与回调地址
- `KMS_MASTER_KEY` —— AES-256-GCM 加密主密钥（32 字节 hex）
- 各 AI 模型 API Key 与 Base URL
- `S3_*` / `STRIPE_*` / `SENTRY_DSN` 等可选项

## 国内模型配置说明

LynxKit 内置国内 6 大模型适配，在 `.env` 中按需填入 Key 即可启用：

| 模型 | 环境变量 | 默认 Base URL |
|------|---------|---------------|
| DeepSeek | `DEEPSEEK_API_KEY` | `https://api.deepseek.com/v1` |
| Kimi（月之暗面） | `KIMI_API_KEY` | `https://api.moonshot.cn/v1` |
| 豆包（字节） | `DOUBAO_API_KEY` | `https://ark.cn-beijing.volces.com/api/v3` |
| 通义千问（阿里） | `QWEN_API_KEY` | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| GLM（智谱） | `GLM_API_KEY` | `https://open.bigmodel.cn/api/paas/v4` |
| MiMo（小米） | `MIMO_API_KEY` | `http://localhost:11434/v1` |

桌面端「设置 → AI 模型」中可可视化配置与测试连通性，支持多模型并行路由。

## License

[MIT](LICENSE) © LynxKit Contributors
