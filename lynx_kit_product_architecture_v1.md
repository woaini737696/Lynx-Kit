# Lynx Kit 产品方案 & 架构文档 v1.0

> **产品定位**：AI 时代全栈开发平台 + AI 应用商店  
> **愿景**：AI 时代，人人都是造物主  
> **目标用户**：有 AI 产品想法但不懂代码的创业者、产品经理、创作者、OPC  
> **核心能力**：用自然语言描述需求，多 Agent 协作开发完整 AI 产品，一键部署，上架 AI 应用商店  
> **文档版本**：v1.0  
> **日期**：2026-07-02

---

## 目录

1. [产品概述](#1-产品概述)
2. [核心概念](#2-核心概念)
3. [系统架构](#3-系统架构)
4. [数据模型](#4-数据模型)
5. [API 设计](#5-api-设计)
6. [Agent 编排引擎](#6-agent-编排引擎)
7. [前端架构](#7-前端架构)
8. [部署架构](#8-部署架构)
9. [安全设计](#9-安全设计)
10. [AI 功能说明](#10-ai-功能说明)
11. [开发计划](#11-开发计划)
12. [关键指标](#12-关键指标)

---

## 1. 产品概述

### 1.1 产品定义

Lynx Kit 是一个 AI 原生全栈开发平台，让用户通过自然语言描述需求，即可开发出完整的 AI 驱动产品（社交、系统、工作站、数据分析、管理后台、App 等），并一键部署上线。产品可上架到 Lynx Kit AI 应用商店，供其他用户发现、使用、付费，形成 AI 时代的应用生态。

### 1.2 核心差异

| 维度 | 传统低代码平台 | Lynx Kit |
|------|---------------|----------|
| 输入方式 | 拖拽组件 | 自然语言描述 |
| 技术选择 | 用户手动选择 | AI 自动匹配最优架构 |
| 开发方式 | 配置参数 | 多 Agent 协作生成完整代码 |
| 产品形态 | 静态页面/简单应用 | 完整 AI 产品（前端+后端+AI+数据库） |
| 部署方式 | 平台托管 | 用户自有服务器 + 云端 Serverless |
| 商业模式 | 工具订阅 | 工具订阅 + 应用商店交易 + API 调用 |
| 生态 | 无 | AI 应用商店，灵感激发飞轮 |

### 1.3 用户画像

| 角色 | 特征 | 需求 | 付费能力 |
|------|------|------|----------|
| **AI 创业者** | 有 AI 产品想法，懂业务不懂技术 | 快速验证 MVP | 高（生产资料投资） |
| **产品经理** | 熟悉产品逻辑，想独立做 side project | 从想法到上线 | 中（个人订阅） |
| **OPC/自由职业** | 一人公司，需要工具提升效率 | 开发服务客户的 AI 工具 | 高（直接创收） |
| **内容创作者** | 有粉丝，想提供 AI 服务变现 | 开发专属 AI 应用 | 中（粉丝变现） |
| **企业业务人员** | 业务部门，需要内部 AI 工具 | 开发内部管理系统 | 高（企业采购） |

### 1.4 产品边界

**做**：
- 自然语言需求输入 → 完整 AI 产品代码生成
- 多 Agent 协作开发（前端 + 后端 + AI + 数据库）
- 一键部署到用户自有服务器或云端
- AI 应用商店（发现、使用、付费、交换）
- 产品迭代（对话式修改、版本管理）

**不做（MVP 阶段）**：
- 复杂游戏开发
- 高性能实时系统（如高频交易）
- 需要特殊硬件驱动的应用
- 涉及敏感合规领域（医疗诊断、金融投资建议）

---

## 2. 核心概念

### 2.1 产品类型（ProductType）

平台预设 8 大产品类型，覆盖 90% 的 AI 产品需求：

```typescript
enum ProductType {
  SOCIAL = 'social',           // AI 社交产品
  SYSTEM = 'system',           // AI 系统平台
  WORKSTATION = 'workstation', // AI 工作站
  DATA = 'data',               // AI 数据分析
  ADMIN = 'admin',             // AI 管理后台
  APP = 'app',                 // AI 应用 App
  MARKETING = 'marketing',     // AI 广告营销
  HARDWARE = 'hardware',       // AI 硬件集成
}
```

### 2.2 架构模板（ArchitectureTemplate）

每个产品类型对应一个预验证的架构模板，包含：
- 技术栈定义（前端框架、后端框架、数据库、AI 模型、部署方式）
- 目录结构（项目脚手架）
- 核心组件（通用组件 + 业务组件）
- 数据库 Schema（基础表 + 业务表）
- API 规范（RESTful / tRPC）
- 部署配置（Docker Compose / Serverless）

### 2.3 构建会话（BuildSession）

一次完整的产品构建过程：
- 用户输入需求 → 意图识别 → 架构选择 → 需求澄清 → Agent 开发 → 测试 → 部署 → 上架
- 每个会话有唯一 ID，支持断点续传、版本回滚

### 2.4 AI 应用商店（AppStore）

- **产品（StoreProduct）**：上架的 AI 产品，包含元数据、定价、版本
- **交易（Transaction）**：购买记录、使用记录、收益分成
- **评价（Review）**：用户评分、评论、使用反馈
- **创作者（Creator）**：产品开发者，有创作者中心管理产品

---

## 3. 系统架构

### 3.1 总体架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                           用户层（多端）                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Web 浏览器   │  │  移动端 PWA   │  │  桌面端（Tauri）│              │
│  │  kit.lynx.ai  │  │  添加到主屏幕  │  │  本地 AI 算力  │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ HTTPS/WSS
┌─────────────────────────────────────────────────────────────────────┐
│                        Lynx Kit 平台层                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                     前端（Next.js 15）                        │  │
│  │  ├─ 构建器界面（灵感输入 / 配置 / 预览 / 调试）              │  │
│  │  ├─ 商店界面（发现 / 搜索 / 详情 / 试用）                    │  │
│  │  ├─ 创作者中心（产品管理 / 收益 / 数据）                    │  │
│  │  └─ 管理后台（用户 / 订单 / 系统监控）                      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                     API 层（tRPC）                            │  │
│  │  ├─ auth.router（认证）                                     │  │
│  │  ├─ build.router（构建会话）                                │  │
│  │  ├─ agent.router（Agent 编排）                             │  │
│  │  ├─ deploy.router（部署管理）                               │  │
│  │  ├─ store.router（商店）                                    │  │
│  │  ├─ creator.router（创作者中心）                            │  │
│  │  └─ system.router（系统管理）                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   Agent 编排引擎（Node.js）                   │  │
│  │  ├─ 意图识别 Agent                                           │  │
│  │  ├─ 架构师 Agent                                             │  │
│  │  ├─ 产品经理 Agent                                           │  │
│  │  ├─ 设计师 Agent                                             │  │
│  │  ├─ 前端开发 Agent                                           │  │
│  │  ├─ 后端开发 Agent                                           │  │
│  │  ├─ AI 集成 Agent                                            │  │
│  │  ├─ 测试修复 Agent                                           │  │
│  │  └─ 部署发布 Agent                                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    数据层                                     │  │
│  │  ├─ PostgreSQL（平台数据库）                                 │  │
│  │  ├─ Redis（缓存 / 队列 / 会话）                              │  │
│  │  └─ MinIO / S3（文件存储）                                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        AI 能力层                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Claude API    │  │ DeepSeek API │  │  Embedding   │              │
│  │ Sonnet 4.6    │  │ V3 / V4     │  │  模型       │              │
│  │ （主力）       │  │ （降级）      │  │  （RAG）    │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        部署层                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │ Vercel        │  │ 用户服务器    │  │ Cloudflare  │            │
│  │ Serverless    │  │ Docker       │  │ Workers     │            │
│  │ （平台托管）   │  │ （自有部署）  │  │ （边缘计算） │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 技术选型

| 层级 | 技术 | 选型理由 |
|------|------|----------|
| **前端框架** | Next.js 15 App Router | AI 生成代码最友好，RSC 减少客户端 JS，Server Actions 简化表单 |
| **UI 组件** | shadcn/ui + Tailwind CSS | AI 生成代码质量最高，组件即拷即用，主题可定制 |
| **状态管理** | Zustand | 轻量，AI 友好，无样板代码 |
| **API 层** | tRPC + Zod | 端到端类型安全，AI 不会写错字段名，自动校验输入 |
| **数据库 ORM** | Prisma | 类型安全，AI 生成 Schema 最稳定，迁移方便 |
| **数据库** | PostgreSQL 16 | 功能丰富，JSON 支持，向量扩展（pgvector），AI 产品刚需 |
| **缓存/队列** | Redis + BullMQ | 异步任务队列（代码生成、部署），会话缓存，限流 |
| **文件存储** | MinIO / S3 | 兼容 S3 API，私有化部署，图片/文档存储 |
| **AI 模型** | Claude Sonnet 4.6（主力）+ DeepSeek-V3（降级） | 代码能力最强，中文场景 DeepSeek 成本低 |
| **Embedding** | OpenAI text-embedding-3 / 本地模型 | RAG 知识库，向量检索 |
| **部署** | Docker Compose + Caddy | 环境隔离，一键启动，自动 SSL |
| **监控** | Sentry + Logtail | 错误追踪，日志收集 |

---

## 4. 数据模型

### 4.1 平台数据库 Schema（Prisma）

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== 用户模块 ====================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  avatar        String?
  phone         String?   @unique
  lynxAiId      String?   @unique
  role          UserRole  @default(USER)
  status        UserStatus @default(ACTIVE)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // 关联
  servers       Server[]
  buildSessions BuildSession[]
  storeProducts StoreProduct[]
  transactions  Transaction[]
  reviews       Review[]
  creatorProfile CreatorProfile?

  @@map("users")
}

enum UserRole {
  USER
  CREATOR
  ADMIN
  SUPER_ADMIN
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  DELETED
}

// ==================== 服务器模块 ====================

model Server {
  id                String   @id @default(cuid())
  userId            String
  name              String
  ip                String
  port              Int      @default(22)
  username          String
  encryptedPassword String
  sshKey            String?
  status            ServerStatus @default(PENDING)
  dockerReady       Boolean  @default(false)
  caddyReady        Boolean  @default(false)
  lastConnectedAt   DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  buildSessions BuildSession[]

  @@index([userId])
  @@map("servers")
}

enum ServerStatus {
  PENDING
  CONNECTED
  DOCKER_READY
  ERROR
}

// ==================== 构建会话模块 ====================

model BuildSession {
  id          String           @id @default(cuid())
  userId      String
  serverId    String?
  name        String
  description String?
  productType ProductType
  status      BuildStatus      @default(DRAFT)
  config      Json             @default("{}")       // 用户配置 JSON
  architecture Json?                                  // 架构方案
  generatedCode Json?                                // 生成的代码包
  deployUrl   String?
  customDomain String?
  version     Int            @default(1)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  user          User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  server        Server?         @relation(fields: [serverId], references: [id])
  logs          BuildLog[]
  versions      BuildVersion[]
  storeProduct  StoreProduct?

  @@index([userId])
  @@index([status])
  @@map("build_sessions")
}

enum ProductType {
  SOCIAL
  SYSTEM
  WORKSTATION
  DATA
  ADMIN
  APP
  MARKETING
  HARDWARE
}

enum BuildStatus {
  DRAFT           // 草稿
  CLARIFYING      // 需求澄清中
  ARCHITECTING    // 架构设计中
  DEVELOPING      // 开发中
  TESTING         // 测试中
  DEPLOYING       // 部署中
  DEPLOYED        // 已部署
  ERROR           // 失败
}

model BuildLog {
  id        String   @id @default(cuid())
  sessionId String
  agent     String   // 哪个 Agent 产生的日志
  level     LogLevel
  message   String
  metadata  Json?    // 额外信息
  createdAt DateTime @default(now())

  session BuildSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId])
  @@map("build_logs")
}

enum LogLevel {
  INFO
  WARN
  ERROR
  DEBUG
}

model BuildVersion {
  id        String   @id @default(cuid())
  sessionId String
  version   Int
  config    Json     // 配置快照
  codeHash  String   // 代码包哈希
  status    String   // success / failed
  createdAt DateTime @default(now())

  session BuildSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId])
  @@map("build_versions")
}

// ==================== 商店模块 ====================

model StoreProduct {
  id          String    @id @default(cuid())
  sessionId   String    @unique  // 关联构建会话
  creatorId   String
  name        String
  description String
  icon        String?
  screenshots String[]
  tags        String[]
  category    StoreCategory
  pricingType PricingType
  price       Decimal?  @db.Decimal(10, 2)  // 单次价格
  monthlyPrice Decimal? @db.Decimal(10, 2)  // 月订阅价格
  status      StoreStatus @default(DRAFT)
  version     String    @default("1.0.0")
  downloadUrl String?
  demoUrl     String?
  apiEndpoint String?   // API 调用地址
  usageCount  Int       @default(0)
  rating      Float     @default(0)
  reviewCount Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  session     BuildSession  @relation(fields: [sessionId], references: [id])
  creator     User          @relation(fields: [creatorId], references: [id])
  transactions Transaction[]
  reviews     Review[]

  @@index([creatorId])
  @@index([category])
  @@index([status])
  @@map("store_products")
}

enum StoreCategory {
  SOCIAL
  SYSTEM
  WORKSTATION
  DATA
  ADMIN
  APP
  MARKETING
  HARDWARE
  AGENT
  WORKFLOW
}

enum PricingType {
  FREE        // 开源免费
  PAY_PER_USE // 按次付费
  SUBSCRIPTION // 订阅制
  EXCHANGE    // 技能交换
  ENTERPRISE  // 企业授权
}

enum StoreStatus {
  DRAFT
  PENDING_REVIEW
  PUBLISHED
  REJECTED
  SUSPENDED
}

model Transaction {
  id          String   @id @default(cuid())
  productId   String
  buyerId     String
  sellerId    String
  type        TransactionType
  amount      Decimal  @db.Decimal(10, 2)
  platformFee Decimal  @db.Decimal(10, 2)
  sellerRevenue Decimal @db.Decimal(10, 2)
  status      TransactionStatus @default(PENDING)
  createdAt   DateTime @default(now())
  completedAt DateTime?

  product StoreProduct @relation(fields: [productId], references: [id])
  buyer   User         @relation(fields: [buyerId], references: [id])

  @@index([productId])
  @@index([buyerId])
  @@map("transactions")
}

enum TransactionType {
  PURCHASE
  SUBSCRIPTION
  API_CALL
  EXCHANGE
}

enum TransactionStatus {
  PENDING
  COMPLETED
  REFUNDED
  FAILED
}

model Review {
  id        String   @id @default(cuid())
  productId String
  userId    String
  rating    Int      // 1-5
  content   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  product StoreProduct @relation(fields: [productId], references: [id])
  user    User         @relation(fields: [userId], references: [id])

  @@index([productId])
  @@map("reviews")
}

// ==================== 创作者模块 ====================

model CreatorProfile {
  id          String   @id @default(cuid())
  userId      String   @unique
  bio         String?
  website     String?
  github      String?
  twitter     String?
  totalRevenue Decimal @default(0) @db.Decimal(10, 2)
  totalProducts Int     @default(0)
  totalUsers   Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("creator_profiles")
}

// ==================== 系统模块 ====================

model SystemConfig {
  id    String @id @default(cuid())
  key   String @unique
  value Json
  updatedAt DateTime @updatedAt

  @@map("system_configs")
}

model Template {
  id          String   @id @default(cuid())
  type        ProductType @unique
  name        String
  description String
  version     String   @default("1.0.0")
  questions   Json     // 需求澄清问题配置
  configMap   Json     // 配置映射规则
  basePath    String   // 模板基座路径
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("templates")
}
```

### 4.2 用户产品数据库 Schema（按架构模板）

每个用户产品独立部署，数据库 Schema 由模板基座定义 + AI 生成扩展。

**通用基础表（所有模板共享）：**

```prisma
// 用户产品中的基础 Schema

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  avatar    String?
  phone     String?  @unique
  role      String   @default("user")  // user, admin
  status    String   @default("active")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String   // email, sms, push, in-app
  title     String
  content   String
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
}

model File {
  id        String   @id @default(cuid())
  userId    String?
  filename  String
  url       String
  mimeType  String
  size      Int
  createdAt DateTime @default(now())
}
```

---

## 5. API 设计

### 5.1 tRPC Router 结构

```typescript
// server/api/root.ts
import { createTRPCRouter } from "./trpc";
import { authRouter } from "./routers/auth";
import { buildRouter } from "./routers/build";
import { agentRouter } from "./routers/agent";
import { deployRouter } from "./routers/deploy";
import { storeRouter } from "./routers/store";
import { creatorRouter } from "./routers/creator";
import { systemRouter } from "./routers/system";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  build: buildRouter,
  agent: agentRouter,
  deploy: deployRouter,
  store: storeRouter,
  creator: creatorRouter,
  system: systemRouter,
});

export type AppRouter = typeof appRouter;
```

### 5.2 构建模块 API

```typescript
// server/api/routers/build.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const buildRouter = createTRPCRouter({
  // 创建构建会话
  create: publicProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      description: z.string().optional(),
      productType: z.nativeEnum(ProductType),
    }))
    .mutation(async ({ ctx, input }) => {
      // 创建会话，返回 sessionId
    }),

  // 获取会话详情
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // 返回会话详情 + 关联日志
    }),

  // 更新会话配置
  updateConfig: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      config: z.record(z.any()),
    }))
    .mutation(async ({ ctx, input }) => {
      // 更新配置，触发重新生成
    }),

  // 获取用户所有会话
  list: publicProcedure
    .input(z.object({
      status: z.nativeEnum(BuildStatus).optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }).optional())
    .query(async ({ ctx, input }) => {
      // 分页返回会话列表
    }),

  // 删除会话
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 软删除，保留数据
    }),

  // 获取会话日志
  getLogs: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      agent: z.string().optional(),
      level: z.nativeEnum(LogLevel).optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      // 返回日志列表
    }),

  // 版本回滚
  rollback: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      version: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 回滚到指定版本
    }),
});
```

### 5.3 Agent 编排 API

```typescript
// server/api/routers/agent.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const agentRouter = createTRPCRouter({
  // 意图识别
  recognizeIntent: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      description: z.string().min(10).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      // 调用意图识别 Agent
      // 返回：productType, confidence, suggestedFeatures
    }),

  // 获取需求澄清问题
  getClarificationQuestions: publicProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // 根据 productType 返回问题列表
    }),

  // 提交澄清答案
  submitClarification: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      answers: z.record(z.any()),
    }))
    .mutation(async ({ ctx, input }) => {
      // 保存答案，生成 config
      // 触发架构师 Agent
    }),

  // 开始开发（触发所有 Agent）
  startDevelopment: publicProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 将任务加入 BullMQ 队列
      // 异步执行多 Agent 编排
    }),

  // 获取开发状态
  getDevelopmentStatus: publicProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // 返回当前 Agent 状态、进度、日志
    }),

  // 对话式修改
  chatModify: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      message: z.string(),
      context: z.string().optional(), // 当前代码上下文
    }))
    .mutation(async ({ ctx, input }) => {
      // 调用修复 Agent，返回修改后的代码
    }),

  // 测试产品
  testProduct: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      testInput: z.string(), // 测试输入
    }))
    .mutation(async ({ ctx, input }) => {
      // 调用测试 Agent，返回测试结果
    }),
});
```

### 5.4 部署模块 API

```typescript
// server/api/routers/deploy.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const deployRouter = createTRPCRouter({
  // 部署到自有服务器
  deployToServer: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      serverId: z.string(),
      domain: z.string().optional(), // 自定义域名
    }))
    .mutation(async ({ ctx, input }) => {
      // SSH 推送代码，Docker Compose 启动
    }),

  // 部署到平台 Serverless
  deployToPlatform: publicProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 部署到 Vercel / Cloudflare
    }),

  // 获取部署状态
  getStatus: publicProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // 返回部署状态、URL、健康检查结果
    }),

  // 配置自定义域名
  configureDomain: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      domain: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // DNS 检测、Caddy 配置、SSL 申请
    }),

  // 重启服务
  restart: publicProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Docker Compose restart
    }),

  // 查看日志
  getRuntimeLogs: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      lines: z.number().default(100),
    }))
    .query(async ({ ctx, input }) => {
      // 返回容器运行日志
    }),
});
```

### 5.5 商店模块 API

```typescript
// server/api/routers/store.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const storeRouter = createTRPCRouter({
  // 获取产品列表
  list: publicProcedure
    .input(z.object({
      category: z.nativeEnum(StoreCategory).optional(),
      pricingType: z.nativeEnum(PricingType).optional(),
      search: z.string().optional(),
      sortBy: z.enum(["popular", "newest", "rating", "price"]).default("popular"),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }).optional())
    .query(async ({ ctx, input }) => {
      // 返回产品列表 + 分页
    }),

  // 获取产品详情
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // 返回产品详情 + 评价 + 创作者信息
    }),

  // 购买产品
  purchase: publicProcedure
    .input(z.object({
      productId: z.string(),
      type: z.nativeEnum(TransactionType),
    }))
    .mutation(async ({ ctx, input }) => {
      // 创建订单，调用支付
    }),

  // 在线试用
  tryDemo: publicProcedure
    .input(z.object({
      productId: z.string(),
      input: z.string(), // 试用输入
    }))
    .mutation(async ({ ctx, input }) => {
      // 调用产品 API，返回试用结果
    }),

  // 提交评价
  submitReview: publicProcedure
    .input(z.object({
      productId: z.string(),
      rating: z.number().min(1).max(5),
      content: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 保存评价，更新产品评分
    }),

  // 上架产品
  publish: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      pricing: z.object({
        type: z.nativeEnum(PricingType),
        price: z.number().optional(),
        monthlyPrice: z.number().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      // 创建 StoreProduct，进入审核或直发
    }),
});
```

---

## 6. Agent 编排引擎

### 6.1 架构设计

Agent 编排引擎是 Lynx Kit 的核心，负责将用户需求转化为完整产品代码。采用**多 Agent 协作 + 任务队列**模式：

```
用户提交需求
    ↓
[任务队列] BullMQ
    ↓
Orchestrator（调度器）
    ├─ 串行执行：意图识别 → 架构选择 → 需求澄清
    ├─ 并行执行：设计师 + 产品经理（可同时）
    ├─ 串行执行：前端 → 后端 → AI 集成（依赖关系）
    ├─ 串行执行：测试 → 修复（循环直到通过）
    └─ 串行执行：部署 → 上架
    ↓
每个 Agent 调用 Claude API 完成特定任务
    ↓
输出完整产品代码包
```

### 6.2 九层 Agent 详细设计

#### 6.2.1 意图识别 Agent（IntentRecognitionAgent）

**职责**：理解用户自然语言需求，识别产品类型和核心功能

**输入**：
```typescript
interface IntentRecognitionInput {
  description: string;        // 用户原始描述
  attachments?: string[];       // 附件（图片、文档链接）
  previousContext?: string;     // 前文语境
}
```

**输出**：
```typescript
interface IntentRecognitionOutput {
  productType: ProductType;     // 识别出的产品类型
  confidence: number;           // 置信度 0-1
  suggestedName: string;        // 建议的产品名称
  coreFeatures: string[];       // 核心功能列表
  targetUsers: string[];        // 目标用户群体
  complexity: 'simple' | 'medium' | 'complex'; // 复杂度评估
  reasoning: string;            // 推理过程（可展示给用户）
}
```

**实现**：
```typescript
class IntentRecognitionAgent {
  async execute(input: IntentRecognitionInput): Promise<IntentRecognitionOutput> {
    // 1. 快速规则匹配（关键词）
    const ruleMatch = this.keywordMatch(input.description);
    if (ruleMatch.confidence > 0.8) {
      return ruleMatch;
    }

    // 2. 调用 Claude Haiku 做语义理解
    const prompt = `分析以下产品需求，判断产品类型和核心功能：

需求描述："""${input.description}"""

请输出 JSON 格式：
{
  "productType": "social|system|workstation|data|admin|app|marketing|hardware",
  "confidence": 0.95,
  "suggestedName": "产品名称",
  "coreFeatures": ["功能1", "功能2"],
  "targetUsers": ["用户群体1"],
  "complexity": "simple|medium|complex",
  "reasoning": "推理过程"
}`;

    const response = await this.claudeHaiku.generate(prompt);
    return JSON.parse(response);
  }

  private keywordMatch(description: string): IntentRecognitionOutput {
    const keywords: Record<ProductType, string[]> = {
      [ProductType.SOCIAL]: ['社交', '交友', '聊天', '匹配', '陪伴', '社群', '社区'],
      [ProductType.SYSTEM]: ['系统', '平台', '中台', '自动化', '引擎', '编排'],
      [ProductType.WORKSTATION]: ['工作站', '工具', '创作', '生产力', '知识管理'],
      [ProductType.DATA]: ['数据', '分析', '报表', '可视化', '洞察', 'BI'],
      [ProductType.ADMIN]: ['管理', '后台', 'CRM', 'ERP', 'OA', '运营'],
      [ProductType.APP]: ['App', '应用', '小程序', '移动端', '客户端'],
      [ProductType.MARKETING]: ['广告', '营销', '投放', '增长', '获客', '转化'],
      [ProductType.HARDWARE]: ['硬件', '物联网', 'IoT', '智能家居', '机器人'],
    };

    // 匹配逻辑...
  }
}
```

#### 6.2.2 架构师 Agent（ArchitectAgent）

**职责**：根据产品类型和复杂度，选择最优技术架构

**输入**：
```typescript
interface ArchitectInput {
  productType: ProductType;
  complexity: 'simple' | 'medium' | 'complex';
  coreFeatures: string[];
  targetUsers: string[];
}
```

**输出**：
```typescript
interface ArchitectOutput {
  architecture: {
    frontend: string;      // Next.js / React Native / Tauri
    backend: string;         // Next.js API / Express / FastAPI
    database: string;        // PostgreSQL / SQLite / MongoDB
    aiModel: string;       // Claude / GPT / DeepSeek / 本地
    deployment: string;    // Docker / Serverless / 混合
    realTime: boolean;     // 是否需要 WebSocket
    multiTenant: boolean;  // 是否多租户
  };
  techStack: string[];       // 完整技术栈列表
  dependencies: string[];    // 关键依赖包
  estimatedCost: {
    ai: number;             // AI API 预估月成本
    infra: number;          // 基础设施预估月成本
  };
  reasoning: string;       // 架构选择理由
}
```

#### 6.2.3 产品经理 Agent（ProductManagerAgent）

**职责**：拆解功能模块，设计用户流程，定义数据模型

**输入**：意图识别输出 + 架构方案 + 用户澄清答案

**输出**：
```typescript
interface ProductManagerOutput {
  modules: Array<{
    name: string;           // 模块名称
    description: string;    // 模块描述
    priority: 'P0' | 'P1' | 'P2'; // 优先级
    userStories: string[];  // 用户故事
  }>;
  userFlows: Array<{
    name: string;           // 流程名称
    steps: string[];        // 流程步骤
  }>;
  dataModels: Array<{
    name: string;           // 模型名称
    fields: Array<{
      name: string;
      type: string;
      required: boolean;
      description: string;
    }>;
  }>;
  apiEndpoints: Array<{
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    description: string;
    params: string[];
    response: string;
  }>;
}
```

#### 6.2.4 设计师 Agent（DesignerAgent）

**职责**：生成 UI 设计方案，包括配色、布局、组件选择

**输入**：产品需求 + 目标用户 + 品牌偏好

**输出**：
```typescript
interface DesignerOutput {
  designSystem: {
    primaryColor: string;      // 主色
    secondaryColor: string;   // 辅色
    backgroundColor: string;  // 背景色
    textColor: string;        // 文字色
    fontFamily: string;       // 字体
    borderRadius: string;     // 圆角
  };
  layouts: Array<{
    page: string;             // 页面名称
    description: string;      // 布局描述
    components: string[];     // 使用的组件
  }>;
  components: Array<{
    name: string;             // 组件名称
    props: string[];          // 组件属性
    style: string;            // 样式描述
  }>;
}
```

#### 6.2.5 前端开发 Agent（FrontendAgent）

**职责**：生成前端代码（React / Next.js / React Native）

**输入**：设计稿 + 产品需求 + API 规范

**输出**：
```typescript
interface FrontendOutput {
  files: Record<string, string>; // 文件路径 -> 代码内容
  structure: {
    pages: string[];        // 页面列表
    components: string[];   // 组件列表
    hooks: string[];        // Hooks 列表
    utils: string[];        // 工具函数
  };
  dependencies: string[];   // 额外依赖
}
```

**代码生成策略**：
1. 基于模板基座的页面骨架
2. AI 填充业务组件和逻辑
3. 使用 shadcn/ui 组件库
4. Tailwind CSS 样式
5. TypeScript 严格类型

#### 6.2.6 后端开发 Agent（BackendAgent）

**职责**：生成后端代码（API / 数据库 / 业务逻辑）

**输入**：数据模型 + API 规范 + 业务逻辑需求

**输出**：
```typescript
interface BackendOutput {
  files: Record<string, string>; // 文件路径 -> 代码内容
  structure: {
    routers: string[];      // API 路由
    services: string[];     // 业务逻辑
    models: string[];       // 数据模型
    middleware: string[];    // 中间件
  };
  prismaSchema: string;     // 完整 Prisma Schema
  dependencies: string[];   // 额外依赖
}
```

#### 6.2.7 AI 集成 Agent（AIIntegrationAgent）

**职责**：集成 LLM、Embedding、RAG、工具调用、多模态

**输入**：AI 功能需求 + 模型选择 + 知识库配置

**输出**：
```typescript
interface AIIntegrationOutput {
  modelConfig: {
    provider: string;       // Claude / OpenAI / DeepSeek
    model: string;          // 具体模型
    temperature: number;    // 温度
    maxTokens: number;      // 最大 Token
    systemPrompt: string;   // 系统提示词
  };
  ragConfig?: {
    enabled: boolean;
    knowledgeBase: string[]; // 知识库文档
    embeddingModel: string;
    topK: number;
  };
  tools: Array<{
    name: string;
    description: string;
    parameters: string;
  }>;
  apiEndpoints: Array<{
    path: string;
    description: string;
  }>;
}
```

#### 6.2.8 测试修复 Agent（TestRepairAgent）

**职责**：自动测试功能，修复 Bug，验证端到端流程

**输入**：完整代码包 + 测试用例

**输出**：
```typescript
interface TestRepairOutput {
  testResults: Array<{
    testCase: string;       // 测试用例
    status: 'pass' | 'fail';
    error?: string;         // 错误信息
    logs: string;           // 测试日志
  }>;
  fixes: Array<{
    file: string;           // 修复的文件
    original: string;     // 原始代码
    fixed: string;          // 修复后的代码
    reason: string;         // 修复原因
  }>;
  allPassed: boolean;       // 是否全部通过
  retryCount: number;       // 重试次数
}
```

**修复策略**：
- **L1 静默修复**：编译错误、类型错误、导入错误，自动修复，不打扰用户
- **L2 引导修复**：逻辑错误、功能不符合预期，向用户展示选项（A/B/C）
- **L3 安全回滚**：致命错误、多次修复失败，自动回滚到上一版本

#### 6.2.9 部署发布 Agent（DeployAgent）

**职责**：打包代码、部署到云端、配置域名、SSL、监控

**输入**：代码包 + 部署目标 + 域名配置

**输出**：
```typescript
interface DeployOutput {
  success: boolean;
  url: string;              // 访问地址
  domain: string;           // 域名
  ssl: boolean;             // SSL 是否配置
  healthCheck: {
    status: 'healthy' | 'unhealthy';
    responseTime: number;    // 响应时间 ms
  };
  logs: string;             // 部署日志
  error?: string;            // 错误信息
}
```

### 6.3 Agent 协作流程

```typescript
// 调度器核心逻辑
class Orchestrator {
  async execute(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);

    // Phase 1: 意图识别（串行）
    const intent = await this.runAgent('intent', session);
    await this.updateSession(sessionId, { productType: intent.productType });

    // Phase 2: 架构选择（串行）
    const architecture = await this.runAgent('architect', { ...session, intent });
    await this.updateSession(sessionId, { architecture });

    // Phase 3: 需求澄清（串行，需要用户参与）
    const questions = await this.runAgent('clarify', { ...session, architecture });
    // 等待用户回答...

    // Phase 4: 产品 + 设计（并行）
    const [product, design] = await Promise.all([
      this.runAgent('productManager', session),
      this.runAgent('designer', session),
    ]);

    // Phase 5: 开发（并行）
    const [frontend, backend, ai] = await Promise.all([
      this.runAgent('frontend', { ...session, design, product }),
      this.runAgent('backend', { ...session, product }),
      this.runAgent('aiIntegration', { ...session, product }),
    ]);

    // Phase 6: 合并代码
    const codePackage = this.mergeCode({ frontend, backend, ai });

    // Phase 7: 测试修复（循环直到通过）
    let testResult = await this.runAgent('testRepair', { ...session, codePackage });
    let retryCount = 0;
    while (!testResult.allPassed && retryCount < 3) {
      const fixedCode = await this.applyFixes(codePackage, testResult.fixes);
      testResult = await this.runAgent('testRepair', { ...session, codePackage: fixedCode });
      retryCount++;
    }

    // Phase 8: 部署
    const deployResult = await this.runAgent('deploy', { ...session, codePackage: testResult.codePackage });

    // Phase 9: 上架（可选）
    if (session.autoPublish) {
      await this.runAgent('publish', { ...session, deployResult });
    }
  }

  private async runAgent(agentName: string, context: any): Promise<any> {
    // 将任务加入 BullMQ 队列
    // 异步执行，记录日志
    // 返回 Agent 输出
  }
}
```

---

## 7. 前端架构

### 7.1 目录结构

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 认证路由组
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (build)/                  # 构建器路由组
│   │   ├── page.tsx              # 灵感输入首页
│   │   ├── [sessionId]/          # 构建会话详情
│   │   │   ├── page.tsx          # 构建控制台
│   │   │   ├── configure/page.tsx # 配置页面
│   │   │   ├── preview/page.tsx  # 预览页面
│   │   │   └── deploy/page.tsx   # 部署页面
│   │   └── layout.tsx            # 构建器布局
│   ├── (store)/                  # 商店路由组
│   │   ├── page.tsx              # 商店首页
│   │   ├── [productId]/page.tsx  # 产品详情
│   │   └── category/[slug]/page.tsx # 分类页
│   ├── (creator)/                # 创作者中心路由组
│   │   ├── dashboard/page.tsx
│   │   ├── products/page.tsx
│   │   └── earnings/page.tsx
│   ├── api/trpc/[trpc]/route.ts  # tRPC API 路由
│   └── layout.tsx                # 根布局
│
├── components/                   # 组件
│   ├── ui/                       # 基础 UI（shadcn/ui）
│   ├── build/                    # 构建器组件
│   │   ├── InspirationInput.tsx  # 灵感输入框
│   │   ├── ArchitectureCard.tsx  # 架构卡片
│   │   ├── ClarificationForm.tsx # 需求澄清表单
│   │   ├── CodePreview.tsx       # 代码预览
│   │   ├── LivePreview.tsx       # 实时预览
│   │   ├── ChatDebugger.tsx      # 对话调试
│   │   └── DeployButton.tsx      # 部署按钮
│   ├── store/                    # 商店组件
│   │   ├── ProductCard.tsx       # 产品卡片
│   │   ├── ProductGrid.tsx       # 产品网格
│   │   ├── ProductDetail.tsx     # 产品详情
│   │   ├── TryDemoModal.tsx      # 试用弹窗
│   │   └── ReviewList.tsx        # 评价列表
│   ├── creator/                  # 创作者组件
│   │   ├── ProductManager.tsx    # 产品管理
│   │   ├── EarningsChart.tsx     # 收益图表
│   │   └── AnalyticsCard.tsx     # 数据卡片
│   └── layout/                   # 布局组件
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
│
├── hooks/                        # 自定义 Hooks
│   ├── useBuildSession.ts        # 构建会话管理
│   ├── useAgentStream.ts         # Agent 流式输出
│   ├── useDeployStatus.ts        # 部署状态轮询
│   └── useStoreSearch.ts         # 商店搜索
│
├── lib/                          # 工具库
│   ├── trpc.ts                   # tRPC 客户端
│   ├── utils.ts                  # 工具函数
│   ├── prisma.ts                 # Prisma 客户端（服务端）
│   └── api.ts                    # API 封装
│
├── types/                        # 类型定义
│   ├── build.ts                  # 构建相关类型
│   ├── agent.ts                  # Agent 相关类型
│   ├── store.ts                  # 商店相关类型
│   └── index.ts                  # 全局类型
│
└── styles/                       # 样式
    └── globals.css               # 全局样式
```

### 7.2 状态管理

```typescript
// 使用 Zustand 管理全局状态

// stores/buildStore.ts
import { create } from 'zustand';

interface BuildState {
  session: BuildSession | null;
  logs: BuildLog[];
  status: BuildStatus;
  currentAgent: string | null;
  progress: number; // 0-100
  setSession: (session: BuildSession) => void;
  addLog: (log: BuildLog) => void;
  setStatus: (status: BuildStatus) => void;
  setCurrentAgent: (agent: string | null) => void;
  setProgress: (progress: number) => void;
}

export const useBuildStore = create<BuildState>((set) => ({
  session: null,
  logs: [],
  status: BuildStatus.DRAFT,
  currentAgent: null,
  progress: 0,
  setSession: (session) => set({ session }),
  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  setStatus: (status) => set({ status }),
  setCurrentAgent: (agent) => set({ currentAgent: agent }),
  setProgress: (progress) => set({ progress }),
}));
```

### 7.3 关键组件设计

#### 灵感输入框（InspirationInput）

```typescript
// components/build/InspirationInput.tsx
"use client";

import { useState } from "react";
import { api } from "@/lib/trpc";
import { useRouter } from "next/navigation";

export function InspirationInput() {
  const [description, setDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const router = useRouter();

  const recognizeIntent = api.agent.recognizeIntent.useMutation({
    onSuccess: (data) => {
      // 跳转到架构确认页面
      router.push(`/build/${data.sessionId}/architecture`);
    },
  });

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setIsAnalyzing(true);

    // 创建会话并识别意图
    const session = await api.build.create.mutate({
      name: description.slice(0, 50),
      description,
      productType: ProductType.APP, // 临时，会被覆盖
    });

    await recognizeIntent.mutate({
      sessionId: session.id,
      description,
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="描述你的 AI 产品想法..."
        className="w-full h-32 p-4 rounded-xl bg-slate-800 border border-white/10 text-white resize-none focus:border-orange-500 outline-none"
      />
      <button
        onClick={handleSubmit}
        disabled={isAnalyzing}
        className="mt-4 w-full py-3 rounded-xl bg-orange-500 text-white font-medium disabled:opacity-50"
      >
        {isAnalyzing ? "AI 正在分析..." : "开始构建"}
      </button>
    </div>
  );
}
```

#### 实时预览（LivePreview）

```typescript
// components/build/LivePreview.tsx
"use client";

import { useEffect, useState } from "react";

interface Props {
  htmlContent: string;      // 生成的 HTML 代码
  device: 'mobile' | 'tablet' | 'desktop';
}

export function LivePreview({ htmlContent, device }: Props) {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    // 创建 Blob URL
    const blob = new Blob([htmlContent], { type: "text/html" });
    const blobUrl = URL.createObjectURL(blob);
    setUrl(blobUrl);

    return () => URL.revokeObjectURL(blobUrl);
  }, [htmlContent]);

  const frameClass = {
    mobile: "w-[375px] h-[667px]",
    tablet: "w-[768px] h-[1024px]",
    desktop: "w-full h-full",
  }[device];

  return (
    <div className="flex justify-center items-center bg-slate-900 rounded-xl p-4">
      <div className={`${frameClass} bg-white rounded-lg overflow-hidden`}>
        <iframe
          src={url}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
          title="Preview"
        />
      </div>
    </div>
  );
}
```

---

## 8. 部署架构

### 8.1 部署模式

| 模式 | 适用场景 | 技术 | 成本 | 控制度 |
|------|----------|------|------|--------|
| **平台 Serverless** | 快速验证、轻量应用 | Vercel / Cloudflare Workers | 低（平台承担） | 低 |
| **用户自有服务器** | 生产环境、数据敏感 | Docker Compose + Caddy | 中（用户承担） | 高 |
| **混合部署** | 前端 Serverless + 后端自有 | Vercel + 用户服务器 | 中 | 中 |

### 8.2 部署流程

```
代码生成完成
    ↓
┌─────────────────┐
│ 用户选择部署方式 │
├─────────────────┤
│ 1. 平台 Serverless│
│ 2. 自有服务器    │
│ 3. 混合部署      │
└─────────────────┘
    ↓

模式 1: 平台 Serverless
    ├─ 前端 → Vercel（自动构建部署）
    ├─ 后端 → Cloudflare Workers / Vercel Edge
    ├─ 数据库 → 平台托管 PostgreSQL（Supabase / Neon）
    └─ AI 调用 → 平台统一中转

模式 2: 自有服务器
    ├─ 打包代码 → ZIP / Docker Image
    ├─ SSH 上传到用户服务器
    ├─ Docker Compose up -d
    ├─ Caddy 配置反向代理 + SSL
    └─ 健康检查

模式 3: 混合部署
    ├─ 前端 → Vercel（CDN 加速）
    ├─ 后端 + 数据库 → 用户服务器
    └─ AI 调用 → 平台统一中转
```

### 8.3 Docker Compose 模板

```yaml
# 用户产品部署模板 docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/app
      - REDIS_URL=redis://redis:6379
      - AI_API_KEY=${AI_API_KEY}
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=app
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy-data:/data
      - caddy-config:/config
    restart: unless-stopped

volumes:
  postgres-data:
  caddy-data:
  caddy-config:
```

---

## 9. 安全设计

### 9.1 数据安全

| 数据类型 | 存储位置 | 加密方式 | 访问控制 |
|----------|----------|----------|----------|
| SSH 密码 | 平台数据库 | AES-256-GCM | 仅用户本人 |
| SSH 密钥 | 平台数据库 | AES-256-GCM | 仅用户本人 |
| 用户业务数据 | 用户自有服务器 | 用户负责 | 用户控制 |
| JWT Token | 客户端 + Redis | HS256 | 过期自动失效 |
| 支付信息 | 第三方支付平台 | 平台不存储 | 支付平台托管 |

### 9.2 部署安全

- **SSH 沙箱**：只允许操作 `/opt/lynx/projects/` 目录，禁止 `rm -rf /` 等危险命令
- **命令白名单**：只允许 `docker`, `docker-compose`, `git`, `npm` 等安全命令
- **路径遍历防护**：禁止 `..` 路径，禁止访问 `/etc`, `/usr`, `/root` 等系统目录
- **网络隔离**：用户产品容器默认不暴露非必要端口

### 9.3 平台安全

- **SQL 注入**：Prisma ORM 参数化查询，零风险
- **XSS**：React 自动转义，富文本用 DOMPurify 净化
- **CSRF**：Next.js 内置 CSRF 保护，SameSite Cookie
- **Rate Limit**：Redis 限流，单 IP 10 次/分钟，单用户 100 次/小时
- **文件上传**：限制类型（jpg/png/webp/pdf），限制大小（10MB），病毒扫描
- **代码注入**：模板引擎严格白名单，用户输入不能直接写入代码文件（必须经过 AI 生成）

### 9.4 合规

- **隐私政策**：用户数据不存储在平台（除必要的服务器连接信息）
- **数据删除**：用户删除产品时，同步删除平台相关数据
- **审计日志**：所有操作记录日志，保留 90 天

---

## 10. AI 功能说明

### 10.1 AI 模型选型

| 用途 | 模型 | 理由 | 成本 |
|------|------|------|------|
| **代码生成（主力）** | Claude Sonnet 4.6 | 代码能力最强，上下文 200K | $3/1M input, $15/1M output |
| **快速分类** | Claude Haiku 4.5 | 速度快，成本低，适合意图识别 | $0.8/1M input, $4/1M output |
| **高并发降级** | DeepSeek-V3 | 中文场景优秀，成本极低 | ~$0.3/1M input |
| **Embedding** | text-embedding-3-large | 向量质量高，支持 3072 维 | $0.13/1M tokens |
| **图像生成** | DALL-E 3 / Stable Diffusion | 产品配图、Logo 生成 | 按量计费 |
| **语音** | Whisper / TTS | 语音转文字、文字转语音 | 按量计费 |

### 10.2 AI 功能清单

| 功能 | 说明 | 实现方式 |
|------|------|----------|
| **意图识别** | 理解用户自然语言需求 | Claude Haiku + 关键词规则 |
| **架构推荐** | 自动选择最优技术架构 | 规则引擎 + Claude Sonnet |
| **需求澄清** | 动态生成结构化问题 | 模板配置 + 上下文理解 |
| **代码生成** | 生成完整前后端代码 | Claude Sonnet + 模板填充 |
| **UI 生成** | 生成界面设计和代码 | Claude Sonnet + shadcn/ui |
| **数据库设计** | 生成 Schema 和查询 | Claude Sonnet + Prisma |
| **API 生成** | 生成 RESTful / tRPC API | Claude Sonnet + Zod |
| **AI 集成** | 集成 LLM、RAG、工具调用 | 配置化 + SDK 封装 |
| **智能修复** | 自动修复代码错误 | Claude Sonnet + 错误分类 |
| **测试生成** | 自动生成测试用例 | Claude Sonnet + 测试框架 |
| **文档生成** | 生成 API 文档、使用说明 | Claude Haiku + 模板 |
| **多语言** | 支持中文/英文/日文等 | Claude 原生多语言 |

### 10.3 RAG 知识库

**用途**：为 AI 产品提供领域知识支持

**实现**：
1. 用户上传文档（PDF、Word、Markdown、网页）
2. 平台自动分块、Embedding、存入向量数据库（pgvector）
3. AI 产品运行时，自动检索相关知识，增强回答质量

**技术栈**：
- 向量数据库：PostgreSQL + pgvector
- Embedding 模型：text-embedding-3-large
- 检索策略：相似度搜索 + 重排序
- 缓存：Redis 缓存热点查询

---

## 11. 开发计划

### 11.1 四周迭代路线

#### Week 1：脚手架 + 意图识别 + AI 社交架构

**目标**：搭建项目骨架，跑通第一个完整架构（AI 社交产品）

**任务清单**：
- [ ] 初始化 Next.js 15 + tRPC + Prisma + Tailwind 项目
- [ ] 配置数据库（PostgreSQL）和 Redis
- [ ] 实现用户认证（注册/登录/找回密码）
- [ ] 实现灵感输入框组件
- [ ] 实现意图识别 Agent（Claude Haiku）
- [ ] 实现 AI 社交架构模板（目录结构、基础组件、数据库 Schema）
- [ ] 实现需求澄清表单（动态问题渲染）
- [ ] 实现构建会话管理（创建/查询/更新）

**验收标准**：
- 用户输入"我想做一个 AI 交友平台"，平台自动识别为 SOCIAL 类型，置信度 > 80%
- 展示架构推荐，用户确认后进入需求澄清
- 回答 5-8 个问题后，生成配置 JSON

#### Week 2：多 Agent 编排 + 实时预览 + 发布

**目标**：实现 9 个 Agent 协作，跑通完整开发链路

**任务清单**：
- [ ] 实现 Agent 调度器（Orchestrator）
- [ ] 实现架构师 Agent（自动选择技术栈）
- [ ] 实现产品经理 Agent（功能拆解）
- [ ] 实现设计师 Agent（UI 方案）
- [ ] 实现前端开发 Agent（代码生成）
- [ ] 实现后端开发 Agent（API + 数据库）
- [ ] 实现 AI 集成 Agent（LLM 配置）
- [ ] 实现测试修复 Agent（L1/L2/L3）
- [ ] 实现实时预览组件（iframe 渲染）
- [ ] 实现对话式调试（自然语言修改代码）
- [ ] 实现一键部署（Serverless + 自有服务器）

**验收标准**：
- 配置完成后，9 个 Agent 协作生成完整代码（前端 + 后端 + AI）
- 实时预览展示可交互的社交产品界面
- 对话式调试能修改功能，即时生效
- 一键部署成功，获得可访问的 URL

#### Week 3：AI 应用商店 MVP

**目标**：实现商店目录、详情、搜索、试用

**任务清单**：
- [ ] 实现商店首页（产品分类、推荐、排行榜）
- [ ] 实现产品搜索（全文搜索 + 标签过滤）
- [ ] 实现产品详情页（简介、截图、评价、创作者）
- [ ] 实现在线试用功能（调用产品 API）
- [ ] 实现产品上架流程（元数据填写、定价设置）
- [ ] 实现创作者中心（产品管理、使用数据）
- [ ] 实现评价系统（评分、评论、点赞）

**验收标准**：
- 用户能浏览商店，按分类查看产品
- 能搜索产品，查看详情和在线试用
- 创作者能上架产品，设置定价

#### Week 4：端到端验证 + 第二个架构

**目标**：找真实用户测试，上线 AI 数据分析架构

**任务清单**：
- [ ] 邀请 3-5 个真实用户测试完整流程
- [ ] 收集反馈，修复体验问题
- [ ] 实现 AI 数据分析架构模板
- [ ] 实现图表组件（ECharts / Recharts）
- [ ] 实现数据导入功能（CSV / Excel）
- [ ] 实现 AI 洞察报告生成
- [ ] 优化性能和稳定性
- [ ] 编写用户引导文档

**验收标准**：
- 3 个非技术用户独立完成从灵感到上架的全流程
- 构建成功率 > 80%
- 端到端转化率 > 30%

### 11.2 技术债务管理

| 阶段 | 允许的技术债务 | 必须偿还的时间 |
|------|---------------|---------------|
| MVP | 硬编码配置、简化权限、单点部署 | Month 2 |
| Growth | 缺少缓存、同步调用、单数据库 | Month 4 |
| Scale | 缺少监控、手动运维、单区域 | Month 6 |

---

## 12. 关键指标

### 12.1 北极星指标

| 指标 | 目标 | 说明 |
|------|------|------|
| **构建成功率** | > 80% | 从灵感到可运行产品的比例 |
| **端到端转化率** | > 30% | 注册 → 成功构建并部署的比例 |
| **商店上架率** | > 40% | 构建成功后选择上架的比例 |
| **商店产品数** | 1000+ | 3 个月内目标 |
| **用户满意度** | NPS > 50 | 愿意推荐给朋友 |

### 12.2 过程指标

| 指标 | 目标 | 说明 |
|------|------|------|
| **意图识别准确率** | > 90% | 正确识别产品类型的比例 |
| **代码生成可用率** | > 90% | 生成代码能编译运行的比例 |
| **L1 修复成功率** | > 70% | 编译错误自动修复的比例 |
| **首次部署耗时** | < 60 秒 | 从点击发布到可访问的耗时 |
| **模板扩展时间** | < 2 周 | 新增一个架构模板的时间 |

### 12.3 商业指标

| 指标 | 目标 | 说明 |
|------|------|------|
| **MAU** | 10,000 | 3 个月内月活用户 |
| **付费转化率** | > 5% | 免费用户转付费比例 |
| **商店 GMV** | ¥100,000 | 3 个月内交易总额 |
| **创作者数** | 500+ | 3 个月内上架产品的创作者 |

---

> **文档版本**：v1.0  
> **更新日期**：2026-07-02  
> **状态**：架构定稿，进入开发阶段  
> **作者**：Lynx Kit 产品团队
