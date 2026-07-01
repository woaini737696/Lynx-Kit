# LynxKit

> **人人都是超级个体** —— 不会代码，也能独立做产品。
>
> 用户只管说需求，平台自动选架构、选模板、生成代码、一键部署。

基于产品规格 v0.2，采用 **原生桌面端 + 原生移动端（iOS/Android）+ Web 备用入口** 的双端互补架构：一套 Flutter 代码编译为原生桌面 + 原生移动端，功能互补而非完全一致；Node.js + Fastify 单一后端服务三端。

---

## 一、技术架构

### 1.1 三端互补分工

| 能力 | 桌面端（Win/Mac/Linux） | 移动端（iOS/Android） | Web |
|------|------------------------|----------------------|-----|
| 项目创建向导 | ✅ 完整 | ❌ | ❌ |
| 代码编辑预览 | ✅ 分屏 | ❌ | ❌ |
| 服务器管理 | ✅ SSH+Docker | 🔍 只读 | ❌ |
| 部署日志 | ✅ 完整流 | 📋 卡片 | ❌ |
| 状态总览 | ✅ 仪表盘 | ✅ 卡片+下拉 | 简化 |
| 推送通知 | ✅ 系统通知 | ✅ FCM/APNs | Web Push |
| 项目快速编辑 | ✅ 编辑器 | 💬 对话式 AI | ❌ |
| 生物识别 | — | ✅ 指纹/Face ID | ❌ |
| 相机扫码 | — | ✅ 扫码部署 | ❌ |
| 系统托盘 / 全局快捷键 | ✅ | — | — |
| 深度链接 | — | ✅ lynxkit:// | URL |

### 1.2 技术栈

- **桌面 + 移动**：Flutter 3（Dart 3）→ 原生编译为 ARM/x64 机器码，共享 85%+ 代码
  - 桌面：Riverpod 2 + go_router + window_manager + tray_manager + hotkey_manager + re_editor
  - 移动：Riverpod 2 + go_router + firebase_messaging + local_auth + mobile_scanner
- **后端 API**：Node.js 20 + Fastify 5 + tRPC 11（OpenAPI 自动生成）+ Prisma 5 + PostgreSQL 16 + BullMQ 5 + Redis 7 + pino
- **鉴权**：NextAuth.js v5（JWT/HS256），桌面端本地续期、移动端 Keychain/Keystore + 生物识别、Web HTTP-only Cookie
- **Web**：Next.js 15 App Router + React 19 + Tailwind 3 + Radix UI + Serwist 9（PWA）
- **类型契约**：Zod schema → tRPC → OpenAPI → Dart codegen（端到端类型安全）
- **加密**：LocalKMS（AES-256-GCM）抽象层，可替换为云 KMS
- **部署**：NodeSSH + Docker Compose + Caddy（自动 SSL）

### 1.3 Agent 七层编排引擎

```
用户输入需求
  ↓
① 意图识别（Claude Haiku，零成本规则匹配兜底）
  ↓
② 需求澄清（自研规则引擎，按 template.json 问题流推进）
  ↓
③ 模板选择（纯查表，零成本）
  ↓
④ 配置填充（Claude Sonnet，占位符替换 + 动态内容生成）
  ↓
⑤ 编译测试（Docker 沙箱，CPU 1核/内存 1G/超时 5min/无网络）
  ↓ 失败
⑥ 修复（L1 静默修复 → L2 引导选择题 → L3 安全回滚）
  ↓ 成功
⑦ 部署（SSH 上传 → docker compose up → Caddy 反代 → 健康检查）
```

---

## 二、Monorepo 结构

```
LynxKit/
├── apps/
│   ├── api/              # 后端 API（Fastify + tRPC + Prisma）
│   ├── web/              # Web 备用入口 + 落地页 + PWA（Next.js 15）
│   ├── desktop/          # Flutter 原生桌面端（Win/Mac/Linux）
│   └── mobile/           # Flutter 原生移动端（iOS/Android）
├── packages/
│   ├── shared/           # TypeScript 共享类型 + Zod schema + 工具 + KMS 抽象
│   ├── agent-core/       # 七层 Agent 编排引擎（LLM Provider + 7 个 Agent + 编排器）
│   ├── deployer/         # 部署执行模块（SSH / Docker / Caddy / 沙箱 / 健康检查）
│   ├── flutter_core/     # Flutter 共享库（models / services / state / theme / widgets）
│   └── templates/        # 6 类模板基座 + _base 通用层
├── docker-compose.dev.yml # 本地 PG + Redis
├── turbo.json            # Turborepo 任务编排
├── pnpm-workspace.yaml   # pnpm workspace 配置
└── tsconfig.base.json    # TS 基础配置
```

---

## 三、快速开始

### 3.1 环境要求

- Node.js ≥ 20.14
- pnpm ≥ 9.12
- Flutter 3.x（含 desktop / iOS / Android 工具链）
- Docker Desktop（用于本地数据库 + ⑤ 沙箱构建）
- PostgreSQL 16 / Redis 7（通过 `docker-compose.dev.yml` 启动）

### 3.2 安装依赖

```bash
pnpm install
cd apps/desktop && flutter pub get && cd ../..
cd apps/mobile && flutter pub get && cd ../..
```

### 3.3 启动本地数据库

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 3.4 配置环境变量

```bash
cp .env.example .env
# 填入 ANTHROPIC_API_KEY、NEXTAUTH_SECRET、JWT_SECRET、KMS_MASTER_KEY 等
```

### 3.5 初始化数据库

```bash
pnpm --filter @lynxkit/api prisma migrate dev
pnpm --filter @lynxkit/api prisma db seed
```

### 3.6 启动各端

```bash
pnpm --filter @lynxkit/api dev          # 后端 API（端口 4000）
pnpm --filter @lynxkit/web dev          # Web 端（端口 3000）
cd apps/desktop && flutter run -d windows   # 桌面端（macos/linux/windows）
cd apps/mobile && flutter run -d <device>   # 移动端
```

---

## 四、6 类产品模板

| 产品类型 | 模板 | 适用场景 |
|---------|------|---------|
| 品牌展示 | static-site | 官网 / 作品集 / 落地页 |
| 服务预约 | service-booking | 教练 / 美容 / 咨询预约 |
| 内容发布 | content-publish | 博客 / 知识库 / newsletter |
| 电商交易 | light-commerce | 手作商城 / 知识付费 |
| 活动管理 | event-manage | 报名 / 签到 / 课程 |
| 管理后台 | admin-dashboard | CRM / 数据看板 / 内部工具 |

每个模板由 `template.json`（问题 + 配置映射）+ `_base/` 通用层（UI / layout / auth / prisma / Docker / Caddy）组成，AI 仅改配置不动骨架。

---

## 五、安全约束

- **SSH 沙箱**：命令白名单 + 路径遍历检测 + 黑名单目录
- **Docker 沙箱**：构建容器只读 rootfs + 无网络 + seccomp + 资源限制
- **KMS 加密**：SSH 凭证 AES-256-GCM 加密存储，绝不落盘明文
- **跨端 JWT**：HS256，桌面端本地续期、移动端 Keychain/Keystore 保护、Web HTTP-only Cookie
- **路径隔离**：每个项目独立目录 `/opt/lynxkit-projects/<projectId>/`

---

## 六、迭代路线

| 阶段 | 目标 |
|------|------|
| Week 1 | 架构骨架 + 类型契约 + 模板基座（本仓库当前状态） |
| Week 2 | 配置填充 Agent 接入 LLM + 模板问题动态联动 |
| Week 3 | 编译沙箱 + 错误解析 + L1/L2 修复策略 |
| Week 4 | 部署执行 + 健康检查 + 端到端联调 |

完整方案见 [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)，产品规格见 [lynx_kit_product_spec_v0.2.md](./lynx_kit_product_spec_v0.2.md)。
