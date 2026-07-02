# LynxKit 实现方案 v3.0（最终版 · 桌面+移动双核心 · AI 全程生成 · MVP 一次到位）

> **定位**：C 端 AI 原生全栈开发平台 + AI 应用商店
> **核心约束**：
> 1. **桌面端 + 移动端为核心**，互补效应（桌面深度构建 + 移动碎片消费），Web 为辅
> 2. **全程 AI 氛围编程，零手写代码**：技术栈必须对 LLM 生成最友好
> 3. **避免日常迭代 bug**：类型安全 + 测试 + CI 门禁
> 4. **一次性交付 MVP**：用户可用本产品开发出第一个 AI 程序
> **日期**：2026-07-02

---

## 一、架构师终极判断（基于核心约束的硬决策）

### 1.1 三大约束反推技术栈

| 约束 | 必然结论 | 否决的方案 |
|------|---------|-----------|
| **桌面+移动双核心** | 必须三端架构（桌面/移动/Web），且桌面端要本地算力 | ❌ Web-only / ❌ PWA 主导 / ❌ Tauri（AI 生成 Rust 质量差） |
| **零手写代码（AI 全程生成）** | 必须选 LLM 训练数据最多、生态最成熟、文档最完善的技术栈 | ❌ Tamagui / ❌ Rust / ❌ Dart / ❌ 自研框架 |
| **避免迭代 bug** | 必须类型安全 + 运行时校验 + E2E 测试 + Feature Flag | ❌ JS / ❌ 弱类型 / ❌ 无测试 |

### 1.2 AI 友好度评分（决定性指标，零手写场景下必须 >85%）

| 技术栈 | AI 生成质量 | 评分 | 是否采用 |
|--------|------------|------|---------|
| TypeScript + React 19 | 极高 | 100% | ✅ |
| Next.js 15 App Router | 极高 | 95% | ✅ |
| Tailwind CSS 4 + shadcn/ui | 极高 | 95% | ✅（Web/Desktop） |
| Expo SDK 52 + React Native | 高 | 85% | ✅（Mobile） |
| NativeWind 4（Tailwind for RN） | 高 | 85% | ✅（Mobile） |
| Electron 30 + React | 高 | 90% | ✅（Desktop） |
| Hono.js | 中高 | 80% | ✅（API） |
| Drizzle ORM | 高 | 85% | ✅ |
| Zod 3 + React Hook Form 7 | 极高 | 95% | ✅ |
| TanStack Query 5 + Zustand 5 | 极高 | 95% | ✅ |
| Vercel AI SDK 5.0 | 高 | 85% | ✅ |
| Tauri + Rust | 一般 | 50% | ❌ 否决 |
| Flutter + Dart | 一般 | 55% | ❌ 否决 |
| Tamagui | 中等 | 65% | ❌ 否决 |
| tRPC | 中等 | 75% | ❌ 否决（外部 API 调用受限） |
| Prisma | 高 | 85% | ❌ 否决（Edge 冷启动慢） |
| NextAuth.js v5 | 中等 | 70% | ❌ 否决（手机验证码需大量手写） |

### 1.3 最终技术栈锁定

**桌面端**：Electron 30 + Next.js 15（本地服务）+ React 19 + shadcn/ui + Tailwind 4
**移动端**：Expo SDK 52 + React Native + NativeWind 4 + Expo Router v4
**Web**：Next.js 15 + shadcn/ui + Tailwind 4
**API 后端**：Hono.js（独立服务，Cloudflare Workers / Node.js 兼容）
**数据层**：Drizzle ORM + PostgreSQL 16（云）+ SQLite（桌面本地缓存）+ pgvector
**AI 层**：Vercel AI SDK 5.0 + 国内 6 大模型（DeepSeek/Kimi/Doubao/Qwen/GLM/Mimo，用户填 Key 即用）+ 桌面端本地模型预留（Ollama/llama.cpp）
**共享层**：Zod + TypeScript + TanStack Query + Zustand + 自研 api-client（基于 OpenAPI）
**任务队列**：BullMQ 5 + Redis（自部署 Worker）+ Upstash（Edge 缓存）
**存储**：Cloudflare R2（生产）+ 本地 FS（桌面）
**认证**：Better Auth（手机验证码/邮箱/微信/Apple/Google）
**支付**：Stripe + Creem（Merchant of Record）
**i18n**：next-intl（Web/Desktop）+ react-i18next（Mobile）
**监控**：Sentry（错误）+ Axiom（日志）+ PostHog（行为 + Feature Flag）
**测试**：Vitest（单元）+ Playwright（E2E）+ Storybook（UI）
**CI/CD**：GitHub Actions + Changesets + EAS（Expo Application Services）

### 1.4 三端互补效应设计

```
┌─────────────────────────────────────────────────────────────┐
│                  桌面端（Electron）                          │
│   适合：深度构建 + 复杂配置 + 代码查看 + 本地预览 + 离线工作   │
│   算力：本地 AI 推理（onnxruntime-node）+ 文件系统访问       │
│   场景：办公室专注开发 AI 产品                              │
└─────────────────────────────────────────────────────────────┘
                          ↕ 数据同步（同一个用户账号）
┌─────────────────────────────────────────────────────────────┐
│                  移动端（Expo）                              │
│   适合：碎片浏览 + 进度查看 + 商店消费 + 试用 + 社交分享     │
│   能力：推送通知 + 摄像头 + 生物识别 + 离线缓存             │
│   场景：通勤/碎片时间查看构建进度 + 商店发现新 AI 产品       │
└─────────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────────┐
│                  Web（Next.js）                             │
│   适合：SEO 入口 + 商店公开页 + 营销 + 管理后台              │
│   场景：搜索引擎用户进入 → 注册 → 下载桌面端/移动端          │
└─────────────────────────────────────────────────────────────┘
```

**互补场景**：
1. 用户在桌面端启动 AI 构建（5-30 分钟长任务）→ 关电脑出门
2. 移动端实时收到推送"构建完成，点击预览"
3. 移动端试用产品 → 满意 → 一键上架到 AI 应用商店
4. 其他用户在移动端商店发现 → 分享给朋友
5. 朋友在 Web 看到产品页 → 下载桌面端开始构建自己的产品

### 1.5 避免 bug 的工程实践（零手写场景下绝对必须）

#### 类型安全层
- **TypeScript strict**：所有 package 都开 `strict: true` + `noUncheckedIndexedAccess: true`
- **Zod runtime**：所有外部输入（API、用户输入、AI 输出）必过 Zod 校验
- **Drizzle 类型推导**：DB schema 即类型，无手写类型
- **OpenAPI 自动生成**：从 Hono 路由自动生成 OpenAPI → 自动生成 api-client

#### 测试层
- **Vitest 单测**：覆盖 `packages/shared` + `packages/agent-core` + `packages/db` 业务逻辑（目标覆盖率 80%）
- **Playwright E2E**：覆盖关键路径（登录/构建流程/部署/购买）
- **Storybook**：UI 组件可视化测试 + 视觉回归
- **MSW**：API mock，前端测试不依赖真实后端

#### CI/CD 门禁层
- **GitHub Actions**：PR 必跑 lint + typecheck + test + build
- **Vercel Preview Deploy**：每 PR 自动预览环境
- **EAS Submit**：Expo 提交 TestFlight + 内测包
- **Changesets**：自动版本 + changelog
- **Renovate**：依赖自动升级（减少手动升级引入 bug）

#### 运行时稳定层
- **React Error Boundary**：组件级错误隔离
- **Sentry**：错误自动上报 + Source Map
- **PostHog Feature Flag**：灰度发布，错误率超阈值自动回滚
- **BullMQ 死信队列**：AI 任务失败重试 3 次
- **AI 断路器**：Claude 失败 → 自动降级 DeepSeek
- **数据库迁移**：Drizzle Kit，向前兼容，零停机

---

## 二、Monorepo 结构（最终版）

```
LynxKit/
├── apps/
│   ├── desktop/                  # 桌面端核心（Electron + Next.js）
│   │   ├── electron/
│   │   │   ├── main.ts           # Electron 主进程
│   │   │   ├── preload.ts        # Preload 桥接
│   │   │   └── services/         # 本地服务（文件/AI推理/SSH）
│   │   ├── next.config.ts        # 复用 apps/web 的 Next.js 配置
│   │   └── package.json
│   ├── mobile/                   # 移动端核心（Expo + React Native）
│   │   ├── app/                  # Expo Router v4 文件路由
│   │   │   ├── (auth)/
│   │   │   ├── (build)/          # 简化构建（输入/进度/预览）
│   │   │   ├── (store)/          # 商店浏览/试用
│   │   │   ├── (creator)/        # 创作者中心
│   │   │   └── _layout.tsx
│   │   ├── src/
│   │   │   ├── components/        # NativeWind 组件
│   │   │   ├── hooks/
│   │   │   └── theme/
│   │   ├── app.config.ts
│   │   └── package.json
│   ├── web/                      # Web（Next.js 15，营销+管理+商店SEO）
│   │   ├── src/app/
│   │   │   ├── (marketing)/      # 营销页（SEO）
│   │   │   ├── (store)/          # 商店（SEO）
│   │   │   ├── (admin)/          # 管理后台
│   │   │   └── (auth)/           # 认证
│   │   └── package.json
│   └── api/                      # 后端 API（Hono.js，独立部署）
│       ├── src/
│       │   ├── routes/           # /auth /build /agent /deploy /store /creator
│       │   ├── agents/           # 9 层 Agent 实现
│       │   ├── middleware/       # auth/ratelimit/logging/error
│       │   ├── queues/           # BullMQ Worker
│       │   └── index.ts
│       ├── drizzle/              # Drizzle migrations
│       └── wrangler.toml         # Cloudflare Workers 部署
├── packages/
│   ├── shared/                   # Zod + 类型 + 常量 + KMS（全端共享）
│   ├── api-client/               # 类型安全 API 客户端（OpenAPI 自动生成）
│   ├── db/                       # Drizzle schema + 客户端（全端共享）
│   ├── ui-web/                   # shadcn/ui 组件（Web + Desktop 共享）
│   ├── ui-mobile/                # NativeWind 组件（Mobile）
│   ├── store/                    # Zustand stores（全端共享）
│   ├── agent-core/               # 9 层 Agent 编排引擎（基于 Vercel AI SDK 5.0）
│   ├── deployer/                 # SSH + Docker + Caddy + Serverless 部署器
│   ├── templates/                # 8 类产品架构模板
│   │   ├── social/               # W1 首发
│   │   └── ... (其他 7 类后续)
│   └── config/                   # 共享 ESLint / TS / Tailwind / PostCSS 配置
├── tools/
│   ├── openapi-gen/              # OpenAPI 自动生成脚本
│   └── e2e/                      # Playwright 测试
├── docker-compose.dev.yml        # 本地 PG + Redis + MinIO
├── .github/workflows/            # CI/CD
├── turbo.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

### 共享层职责（关键：避免重复代码 = 避免 bug）

| Package | 共享内容 | 跨端复用 |
|---------|---------|---------|
| `shared` | Zod schema + TS 类型 + 常量 + KMS | Desktop/Mobile/Web/API 全部 |
| `api-client` | 类型安全的 fetch 客户端 | Desktop/Mobile/Web |
| `db` | Drizzle schema + 迁移 | API + Desktop（本地 SQLite 子集） |
| `store` | Zustand stores（auth/build/ui） | Desktop/Mobile/Web |
| `agent-core` | Agent 编排引擎 | API（执行） |
| `templates` | 8 类模板元数据 | API（生成代码时读取） |
| `config` | ESLint/TS/Tailwind 配置 | 全部 |

**核心原则**：业务逻辑（hooks/stores/api-client/types）跨端 100% 共享，UI 各端原生（shadcn/ui vs NativeWind）。

---

## 三、九层 Agent 编排引擎（基于 Vercel AI SDK 5.0）

### 3.1 编排流程

```
用户输入（桌面端/移动端）
    ↓ POST /api/v1/build/start
Hono API → BullMQ 入队 → Orchestrator
  ├─ 串行：①意图识别 → ②架构师 → ③需求澄清
  ├─ 并行：④产品经理 + ⑤设计师
  ├─ 串行：⑥前端 → ⑦后端 → ⑧AI 集成
  ├─ 循环：⑨测试修复（L1/L2/L3，最多 3 轮）
  └─ 串行：⑩部署发布 + 上架
    ↓ Vercel AI SDK 5.0 streamText + multi-step
SSE 流式推送（API → 桌面/移动端）
    ↓
前端实时显示 Agent 进度 + 生成的代码
```

### 3.2 Vercel AI SDK 5.0 优势

| 能力 | 自带支持 | 替代方案工作量 |
|------|---------|---------------|
| 多 Agent 编排 | ✅ multi-step + tool calling | 自研 2 周 |
| 流式输出 | ✅ streamText 一行 | 自研 SSE 推送 1 周 |
| Tool Calling | ✅ 原生（写文件/查 DB/调 API） | 自研 1 周 |
| 失败重试 | ✅ 内置 | 自研 3 天 |
| 多模型切换 | ✅ 一行代码 | 自研 3 天 |
| Token 计数 | ✅ 内置 | 自研 1 天 |

**决策**：用 Vercel AI SDK 5.0 处理 Agent 内逻辑 + BullMQ 处理跨 Agent 任务持久化（断点续传、超时控制）。

### 3.3 Agent 清单

| # | Agent | 职责 | 模型 | 工具 |
|---|-------|------|------|------|
| ① | 意图识别 | 识别产品类型 + 核心功能 | Qwen-Turbo/DeepSeek + 规则 | 规则引擎 |
| ② | 架构师 | 选择最优技术栈 | 规则 + GLM-4-Plus | 模板查询 |
| ③ | 需求澄清 | 动态问题流 | 规则引擎 | 表单生成器 |
| ④ | 产品经理 | 功能拆解 + 数据模型 + API | DeepSeek-V3 / Kimi | Drizzle schema 生成 |
| ⑤ | 设计师 | 设计系统 + 布局 + 组件 | Doubao-Pro / Qwen | shadcn 组件库 |
| ⑥ | 前端开发 | 生成 React/Next.js 代码 | DeepSeek-V3 + 模板 | 文件写入 |
| ⑦ | 后端开发 | 生成 Hono API + Drizzle schema | DeepSeek-V3 + 模板 | 文件写入 |
| ⑧ | AI 集成 | LLM/RAG/工具调用配置 | 配置化 + Qwen | 配置生成器 |
| ⑨ | 测试修复 | L1静默/L2引导/L3回滚 | DeepSeek + 沙箱 | Bash 执行器 |
| ⑩ | 部署发布 | SSH/Docker/Caddy/Serverless | 执行器 | SSH/Docker 命令 |

### 3.5 国内模型生态（用户填 Key 即用）

所有国内主流模型均提供 OpenAI 兼容 API，统一通过 `@ai-sdk/openai-compatible` 接入：

| Provider | 模型示例 | API Base | 适用场景 |
|----------|---------|----------|---------|
| **DeepSeek** | deepseek-chat / deepseek-coder / deepseek-reasoner | `https://api.deepseek.com/v1` | 代码生成（最强）、推理 |
| **Kimi（Moonshot）** | moonshot-v1-8k/32k/128k / kimi-latest | `https://api.moonshot.cn/v1` | 长上下文（200 万 tokens） |
| **Doubao（字节）** | doubao-pro-32k / doubao-lite-32k | `https://ark.cn-beijing.volces.com/api/v3` | 高性价比、设计建议 |
| **Qwen（阿里通义）** | qwen-turbo / qwen-plus / qwen-max / qwen-coder | `https://dashscope.aliyuncs.com/compatible-mode/v1` | 通用、意图识别 |
| **GLM（智谱）** | glm-4-plus / glm-4-flash / glm-4-air | `https://open.bigmodel.cn/api/paas/v4` | 架构推荐、中文场景 |
| **Mimo（小米）** | mimo-7b / mimo-coder | 本地或第三方托管 | 桌面端本地推理 |

**用户使用流程**：
1. 注册 LynxKit → 进入"模型配置"页
2. 选择要使用的模型 Provider（可多选）
3. 填入对应 API Key（明文存储于本地，桌面端 AES 加密）
4. 系统自动测试连通性，显示余额/速率
5. 开始构建 AI 产品，自动选择最优模型组合

**桌面端本地模型预留**：
- 接口：`@ai-sdk/openai-compatible` + 本地 endpoint（如 `http://localhost:11434/v1` Ollama）
- 用户安装 Ollama → `ollama pull qwen2.5-coder:7b` → LynxKit 桌面端自动检测 → 离线可用
- 未来扩展：node-llama-cpp 直接在 Electron 主进程推理

### 3.4 修复策略

- **L1 静默修复**：编译/类型/导入错误 → AI 自动重写，不打扰用户
- **L2 引导修复**：逻辑错误 → 向用户展示 A/B/C 选择题
- **L3 安全回滚**：致命错误/多次失败 → 自动回滚上一可用版本

---

## 四、数据模型（Drizzle ORM + PostgreSQL 16 + pgvector + SQLite）

### 4.1 平台数据库（11 张核心表）

| 模块 | 表 | 说明 |
|------|-----|------|
| 用户 | `users` | email/name/avatar/role |
| 服务器 | `servers` | 用户自有服务器（SSH 凭证 AES-256-GCM） |
| 构建会话 | `build_sessions` | 核心：productType/config/architecture/generatedCode/status |
| 构建日志 | `build_logs` | 每个 Agent 执行日志（结构化 JSON） |
| 版本快照 | `build_versions` | 配置快照 + 代码 hash，支持回滚 |
| 商店产品 | `store_products` | 上架产品（定价/截图/分类/版本） |
| 交易 | `transactions` | 购买/订阅/API 调用 |
| 评价 | `reviews` | 1-5 星 + 评论 |
| 创作者 | `creator_profiles` | bio/收益/产品数 |
| 系统 | `system_configs` | key-value 配置 |
| 模板 | `templates` | 8 类模板元数据 |

### 4.2 桌面端本地数据库（SQLite，离线缓存）

复用 `packages/db` 的 Drizzle schema，仅缓存：
- 当前用户的 build_sessions（最近 30 天）
- 当前用户的 store_products
- 模板缓存
- 离线草稿

### 4.3 性能优化

- pgvector HNSW 索引（向量检索）
- 复合索引（user_id + status + created_at）
- JSONB GIN 索引
- 桌面端 SQLite WAL 模式（并发读）

---

## 五、8 类产品类型 + 架构模板

| 类型 | 标签 | Week |
|------|------|------|
| SOCIAL | AI 社交 | W1（首发） |
| SYSTEM | AI 系统 | W2 |
| WORKSTATION | AI 工作站 | W2 |
| DATA | AI 数据分析 | W4 |
| ADMIN | AI 管理后台 | W3 |
| APP | AI 应用 App | W3 |
| MARKETING | AI 营销 | W4 |
| HARDWARE | AI 硬件 | W4+ |

每个模板：`template.json`（元数据）+ `scaffold/`（脚手架）+ `schema.ts`（Drizzle）+ `components/`（核心组件）+ `questions.ts`（澄清问题）。

---

## 六、前端架构（三端分别说明）

### 6.1 桌面端（apps/desktop，Electron + Next.js）

```
apps/desktop/
├── electron/
│   ├── main.ts                # 主进程：窗口管理 + 本地服务
│   ├── preload.ts             # 安全桥接
│   └── services/
│       ├── ai-local.ts        # 本地 AI 推理（onnxruntime-node）
│       ├── ssh.ts              # SSH 部署
│       ├── filesystem.ts       # 文件系统访问
│       └── notification.ts     # 系统通知 + 托盘
├── src/                        # 复用 apps/web 的 src（符号链接或 alias）
├── next.config.ts              # 静态导出 + Electron 加载
└── package.json
```

**桌面端专属能力**：
- 本地 AI 推理（onnxruntime-node，离线可用）
- 文件系统直接访问（保存生成的代码到本地）
- SSH 部署到用户服务器
- 系统托盘 + 全局快捷键
- 多窗口（构建器 + 预览 + 调试）
- 离线工作（SQLite 缓存）

### 6.2 移动端（apps/mobile，Expo + React Native）

```
apps/mobile/
├── app/                        # Expo Router v4
│   ├── (auth)/                 # 登录/注册
│   ├── (build)/                # 简化构建
│   │   ├── index.tsx           # 灵感输入
│   │   ├── [sessionId].tsx     # 进度查看（SSE 流式）
│   │   └── preview.tsx         # WebView 预览
│   ├── (store)/                # 商店浏览
│   ├── (creator)/              # 创作者中心
│   └── _layout.tsx
├── src/
│   ├── components/             # NativeWind 组件
│   ├── hooks/
│   └── theme/
├── app.config.ts               # Expo 配置
└── package.json
```

**移动端专属能力**：
- Expo Router v4（file-based，类似 Next.js App Router）
- 推送通知（APNs/FCM）
- 生物识别（FaceID/指纹）
- 摄像头（扫描商品码/上传图片）
- 离线缓存（AsyncStorage）
- OTA 更新（EAS Update，避免 App Store 审核）
- WebView 预览生成的 AI 产品

### 6.3 Web（apps/web，Next.js 15，营销+管理+商店）

```
apps/web/
├── src/app/
│   ├── (marketing)/            # 营销页（SEO）
│   ├── (store)/                # 商店（SEO）
│   ├── (admin)/                # 管理后台
│   └── (auth)/                 # 认证
└── package.json
```

### 6.4 跨端共享层（关键：避免 bug 的核心）

| 共享内容 | 位置 | 三端如何用 |
|---------|------|-----------|
| Zod schema | `packages/shared` | Desktop/Mobile/Web/API 直接 import |
| TS 类型 | `packages/shared` | 同上 |
| API 客户端 | `packages/api-client` | 基于 OpenAPI 自动生成，三端共用 |
| Zustand stores | `packages/store` | Desktop/Mobile/Web 共用业务状态 |
| Drizzle schema | `packages/db` | API + Desktop（SQLite 子集） |
| Agent 编排 | `packages/agent-core` | API（执行） |
| 模板 | `packages/templates` | API（生成代码时读取） |

**关键**：业务逻辑（hooks/stores/api-client）跨端 100% 共享，UI 各端原生。

---

## 七、API 后端架构（Hono.js，独立服务）

### 7.1 为什么独立后端而不是 Next.js Server Actions

- 三端都要调 API（桌面/移动/Web），Server Actions 仅 Web 可用
- Hono.js Edge-first，部署 Cloudflare Workers（全球 <100ms）
- Hono + OpenAPI 自动生成 → 自动生成 api-client
- 独立部署 = 独立扩展（API 压力大时不影响 Web）

### 7.2 路由结构

```
apps/api/src/routes/
├── auth/                       # 认证
├── build/                      # 构建会话 CRUD
├── agent/                      # Agent 流式接口（SSE）
├── deploy/                     # 部署
├── store/                      # 商店
├── creator/                     # 创作者中心
└── system/                     # 系统
```

### 7.3 部署

- **生产**：Cloudflare Workers（Edge，全球 <100ms）
- **长任务 Worker**（BullMQ + AI 代码生成）：Railway / Fly.io
- **数据库**：Neon Serverless PostgreSQL + pgvector
- **Redis**：Upstash Redis

---

## 八、部署架构

### 8.1 平台自身部署

| 层 | 部署 | 说明 |
|----|------|------|
| API（apps/api） | Cloudflare Workers | Edge，全球 <100ms |
| 长任务 Worker | Railway / Fly.io | BullMQ AI 代码生成（5-30 分钟任务） |
| Web（apps/web） | Vercel | 营销 + 管理 + 商店 SEO |
| 桌面端（apps/desktop） | Electron 打包 → GitHub Releases | Win/Mac/Linux |
| 移动端（apps/mobile） | EAS Submit → App Store / Play Store | iOS/Android |
| 数据库 | Neon Serverless PG + pgvector | 自动备份 |
| Redis | Upstash | Edge 内访问 |
| 文件存储 | Cloudflare R2 | S3 兼容，零出口费 |

### 8.2 用户产品部署（部署器）

| 模式 | 场景 | 技术 |
|------|------|------|
| 平台 Serverless | 快速验证 | Vercel + Neon |
| 用户自有服务器 | 生产 | Docker Compose + Caddy |
| 混合部署 | 前端 CDN + 后端自有 | Vercel + 用户服务器 |

部署流程：代码生成 → 用户选模式 → 上传/构建 → Caddy 反代+SSL → 健康检查 → 返回 URL。

---

## 九、安全设计

- **认证**：Better Auth（bcrypt + JWT + Refresh，手机验证码/微信/Apple）
- **SSH 凭证**：AES-256-GCM 加密
- **SSH 沙箱**：命令白名单 + 路径黑名单 + 超时
- **限流**：Upstash Ratelimit
- **文件上传**：类型 + 大小 + 病毒扫描
- **SQL 注入**：Drizzle 参数化
- **XSS**：React 自动转义 + DOMPurify
- **CSRF**：SameSite + Better Auth
- **审计日志**：pino + Axiom
- **多租户隔离**：RLS + Schema 隔离

---

## 十、MVP 一次性实现范围（用户可用本产品开发出第一个 AI 程序）

### MVP 必须跑通的完整闭环

```
用户注册登录 → 输入"我想做一个 AI 社交平台"
→ ①意图识别（识别为 SOCIAL，置信度 >80%）
→ ②架构师（推荐 AI 社交架构）
→ ③需求澄清（5-8 个问题动态生成）
→ ④产品经理（生成功能列表 + 数据模型）
→ ⑤设计师（生成设计系统 + 布局）
→ ⑥前端开发（生成 Next.js 代码）
→ ⑦后端开发（生成 Hono API + Drizzle schema）
→ ⑧AI 集成（配置 LLM/RAG）
→ ⑨测试修复（L1 静默自动修复类型错误）
→ ⑩部署发布（一键部署到 Vercel）
→ 用户获得可访问的 URL → 产品上架到商店
```

### MVP 交付清单（一次到位）

#### 基础设施（Phase 0）
- [ ] 清理旧 Flutter 代码
- [ ] 重建 monorepo 骨架（turbo.json / pnpm-workspace / tsconfig.base）
- [ ] `packages/shared`：Zod schema + 8 类 ProductType + 常量 + KMS
- [ ] `packages/db`：Drizzle schema（11 张表 + RLS）+ migrations
- [ ] `packages/api-client`：基于 OpenAPI 自动生成
- [ ] `packages/store`：Zustand stores（auth/build/ui）
- [ ] `packages/ui-web`：shadcn/ui 组件基础
- [ ] `packages/ui-mobile`：NativeWind 组件基础
- [ ] `packages/config`：共享 ESLint / TS / Tailwind
- [ ] `docker-compose.dev.yml`：PG + Redis + MinIO
- [ ] `.env.example`：全部环境变量
- [ ] GitHub Actions CI（lint + typecheck + test + build）

#### API 后端（Phase 1）
- [ ] `apps/api`：Hono.js 脚手架
- [ ] Better Auth 集成（邮箱密码 + 手机验证码）
- [ ] 限流 + 日志 + 错误中间件
- [ ] OpenAPI 自动生成
- [ ] 部署到 Cloudflare Workers（dev 环境）

#### Agent 编排引擎（Phase 2）
- [ ] `packages/agent-core`：基于 Vercel AI SDK 5.0 的编排引擎
- [ ] ①意图识别 Agent（Haiku + 规则）
- [ ] ②架构师 Agent（规则 + Sonnet）
- [ ] ③需求澄清 Agent（规则引擎）
- [ ] ④产品经理 Agent（Sonnet）
- [ ] ⑤设计师 Agent（Sonnet）
- [ ] ⑥前端开发 Agent（Sonnet + 模板）
- [ ] ⑦后端开发 Agent（Sonnet + 模板）
- [ ] ⑧AI 集成 Agent（配置化 + Sonnet）
- [ ] ⑨测试修复 Agent（L1 静默 + L2 引导 + L3 回滚）
- [ ] ⑩部署发布 Agent（Vercel Serverless）
- [ ] BullMQ 任务队列 + 流式 SSE 推送
- [ ] `packages/templates/social`：AI 社交模板（完整脚手架 + schema + questions）

#### 桌面端（Phase 3）
- [ ] `apps/desktop`：Electron + Next.js 脚手架
- [ ] 主进程 + preload + 本地服务
- [ ] 复用 `apps/web` 的 src（构建器界面）
- [ ] 灵感输入框（Server Action + streamText）
- [ ] 架构匹配卡片
- [ ] 动态澄清表单（RHF + Zod）
- [ ] 实时预览（iframe + Blob URL）
- [ ] Agent 进度流（SSE）
- [ ] 对话式调试（streamText + multi-step）
- [ ] 一键部署按钮
- [ ] 系统托盘 + 离线缓存

#### 移动端（Phase 4）
- [ ] `apps/mobile`：Expo + React Native 脚手架
- [ ] Expo Router v4 路由
- [ ] NativeWind 4 + 主题
- [ ] 登录/注册
- [ ] 灵感输入（简化版）
- [ ] 构建进度查看（SSE）
- [ ] WebView 预览
- [ ] 商店浏览（首页/列表/详情）
- [ ] 创作者中心（产品管理）
- [ ] 推送通知（构建完成）

#### Web（Phase 5）
- [ ] `apps/web`：Next.js 15 脚手架
- [ ] 营销首页（SEO）
- [ ] 商店公开页（SEO）
- [ ] 管理后台基础
- [ ] 认证页

#### 商店 + 创作者中心（Phase 6，简化版）
- [ ] 商店首页（分类/推荐）
- [ ] 产品详情页
- [ ] 上架流程（元数据/定价）
- [ ] 创作者中心（产品管理）
- [ ] Stripe 支付集成（一次性购买 + 订阅）

#### 部署 + 收尾（Phase 7）
- [ ] Playwright E2E 关键路径
- [ ] Storybook 组件文档
- [ ] Sentry + Axiom + PostHog 接入
- [ ] Changesets 版本管理
- [ ] 推送到个人私有仓库
- [ ] 桌面端打包（Win/Mac/Linux）
- [ ] 移动端 EAS 提交（TestFlight + 内测）

### MVP 验收标准

用户在桌面端输入"我想做一个 AI 社交平台，能根据兴趣匹配朋友"：
1. ✅ 5 秒内识别为 SOCIAL 类型，置信度 >80%
2. ✅ 展示推荐架构（Next.js + Hono + Drizzle + pgvector + Claude）
3. ✅ 5-8 个澄清问题（匹配算法/聊天/AI 助手/情感分析等）
4. ✅ 用户回答后开始 9 Agent 协作（流式显示进度）
5. ✅ 5-10 分钟生成完整可运行代码（前端 + 后端 + AI 配置）
6. ✅ 实时预览可交互
7. ✅ 对话修改"加一个语音聊天功能" → 增量生成
8. ✅ 一键部署到 Vercel → 获得 URL
9. ✅ 自动上架到商店
10. ✅ 移动端收到推送"构建完成"
11. ✅ 移动端可预览/试用

---

## 十一、接下来的开发计划（按周排期）

### Week 1：基础设施 + API 后端 + 桌面端核心
- Day 1-2：清理旧代码 + 重建 monorepo + packages/shared + packages/db + packages/config
- Day 3-4：apps/api（Hono + Better Auth + Drizzle + OpenAPI）+ docker-compose
- Day 5-7：apps/desktop（Electron + Next.js 复用）+ 灵感输入框 + 意图识别 Agent（①）

### Week 2：9 层 Agent + AI 社交模板
- Day 8-10：agent-core ②架构师 + ③需求澄清 + ④产品经理 + ⑤设计师
- Day 11-13：⑥前端开发 + ⑦后端开发 + ⑧AI 集成 + ⑨测试修复 + ⑩部署
- Day 14：packages/templates/social（完整 AI 社交模板）+ 端到端联调

### Week 3：移动端 + 商店 + 创作者中心
- Day 15-17：apps/mobile（Expo + React Native + NativeWind）+ 简化构建 + 进度流
- Day 18-19：商店首页 + 详情页 + 上架流程
- Day 20-21：创作者中心 + Stripe 支付

### Week 4：部署 + 测试 + 上线
- Day 22-23：apps/web（营销 + 商店 SEO + 管理后台）
- Day 24-25：Playwright E2E + Storybook + Sentry/Axiom/PostHog
- Day 26-27：桌面端打包（Win/Mac/Linux）+ 移动端 EAS 提交
- Day 28：推送仓库 + 用户文档 + 上线

---

## 十二、技术债务管理

| 阶段 | 允许债务 | 偿还时间 |
|------|---------|---------|
| MVP | 硬编码配置、简化权限、单点部署 | Month 2 |
| Growth | 缺缓存、同步调用、单库 | Month 4 |
| Scale | 缺监控、手动运维、单区域 | Month 6 |

---

## 十三、关键指标（KPI）

- 构建成功率 > 80%
- 端到端转化率 > 30%
- 意图识别准确率 > 90%
- 代码生成可用率 > 90%
- L1 修复成功率 > 70%
- 首次部署 < 60s
- LCP < 1.5s
- AI 首字延迟 < 500ms
- AI 完整生成 < 10 分钟
- 桌面端冷启动 < 3s
- 移动端冷启动 < 2s

---

## 十四、本方案对核心约束的回应

| 核心约束 | 方案回应 |
|---------|---------|
| **桌面+移动双核心** | Electron（桌面深度构建）+ Expo（移动碎片消费）互补，共享业务逻辑层 |
| **零手写代码（AI 全程生成）** | 全栈 TypeScript + React + shadcn/ui + NativeWind + Drizzle + Hono，全部 AI 友好度 >85% |
| **避免迭代 bug** | TypeScript strict + Zod + Vitest + Playwright + CI 门禁 + Sentry + Feature Flag |
| **一次性 MVP 可用** | 完整 9 Agent + AI 社交模板 + 一键部署 + 商店上架，用户可端到端跑通开发第一个 AI 程序 |

---

> **状态**：待用户确认。确认后立即开始 Week 1（基础设施 + API + 桌面端核心），按周排期推进至 Week 4 MVP 上线。
> **核心架构**：Electron + Expo + Next.js + Hono + Drizzle + Vercel AI SDK 5.0 + Better Auth + Stripe + Upstash + Cloudflare。
> **零手写保证**：全部技术栈 AI 生成友好度 ≥80%，最大化 AI 氛围编程效率。
