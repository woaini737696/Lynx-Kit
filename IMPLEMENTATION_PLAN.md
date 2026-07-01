# LynxKit 实现方案 v1.2（原生双端互补架构版）

> 基于产品规格 v0.2 + 用户原生双端互补要求

---

## 一、原生双端架构核心设计

### 1.1 架构原则

- **原生编译**：Flutter 编译为原生 ARM/x64 机器码，桌面端 + 移动端均为真正原生应用
- **一套 Dart 代码**：桌面 + 移动共享 85%+ 代码，仅平台特定能力通过 Platform Channel 扩展
- **功能互补分工**：桌面端做重型操作，移动端做轻型互补，Web 做备用入口
- **统一后端服务**：Node.js + Fastify 单一后端 API，三端共享
- **类型契约同步**：Zod schema → OpenAPI → Dart codegen，端到端类型安全

### 1.2 三端功能分工矩阵（互补设计）

| 能力维度 | 桌面端（Win/Mac/Linux） | 移动端（iOS/Android） | Web 端 |
|---------|----------------------|---------------------|--------|
| **核心定位** | 重型操作工作台 | 轻型互补监控端 | 落地页 + 备用 |
| **项目创建向导** | ✅ 完整（多步骤+AI对话+实时预览） | ❌ | ❌ |
| **代码编辑预览** | ✅ 分屏视图 | ❌ | ❌ |
| **服务器管理** | ✅ SSH 配置+凭证+Docker 检测 | 🔍 只读状态查看 | ❌ |
| **部署日志** | ✅ 完整日志流 | 📋 简化结果卡片 | ❌ |
| **多窗口/多标签** | ✅ 多项目管理 | ❌ | ❌ |
| **系统托盘** | ✅ 常驻+快捷操作 | — | — |
| **文件拖拽上传** | ✅ Logo/模板上传 | 📷 相册选择 | 表单上传 |
| **全局快捷键** | ✅ 唤起应用 | — | — |
| **状态总览** | ✅ 仪表盘 | ✅ 卡片列表+下拉刷新 | 简化版 |
| **推送通知** | ✅ 系统通知 | ✅ 推送（部署成功/失败） | Web Push |
| **项目快速编辑** | ✅ 完整编辑器 | 💬 对话式 AI 修改 | ❌ |
| **数据看板** | ✅ 完整图表 | 📊 简化版图表 | 简化版 |
| **项目分享** | 🔗 生成链接 | 📱 生成二维码 | 链接分享 |
| **生物识别登录** | — | ✅ 指纹/Face ID | 密码登录 |
| **相机扫码** | — | ✅ 扫码部署 | ❌ |
| **离线缓存** | ✅ 本地数据库 | ✅ 关键数据缓存 | PWA 缓存 |
| **自动更新** | ✅ Tauri Updater 风格 | ✅ 应用内更新 | Vercel 部署 |
| **深度链接** | — | ✅ lynxkit:// 项目/服务器 | URL 路由 |

### 1.3 架构总览

```
                ┌──────────────────────────────────────────┐
                │         Backend API 核心服务              │
                │  (apps/api - Node.js 20 + Fastify 5)     │
                │  - tRPC 11 + OpenAPI 自动生成            │
                │  - Prisma 5 + PostgreSQL 16              │
                │  - BullMQ 5 + Redis 7                    │
                │  - NextAuth.js (JWT 跨端鉴权)            │
                │  - Agent 编排引擎（7 层）                 │
                │  - 部署模块（SSH + Docker + Caddy）       │
                │  - pino 结构化日志                       │
                └──────┬────────────────┬──────────────────┘
                       │                │
                       │ REST/OpenAPI   │
            ┌──────────┴──┐         ┌───┴───────────────┐
            │ Flutter     │         │ Flutter Mobile    │
            │ Desktop     │         │ (iOS + Android)   │
            │ (Win/Mac/   │         │                   │
            │  Linux)     │         │                   │
            │ 重型功能    │         │ 轻型互补功能      │
            └──────┬──────┘         └───────┬───────────┘
                   │                        │
                   └───── 共享 85%+ Dart 代码 ─┘
                          (packages/flutter_core)

         ┌──────────────┐
         │ Next.js Web  │  ← 备用入口 + 落地页 + PWA
         │ (apps/web)   │
         └──────────────┘
```

### 1.4 Flutter 代码共享策略

```
packages/flutter_core/          # 共享 Dart 库
├── lib/
│   ├── models/                 # 数据模型（OpenAPI 生成）
│   ├── services/               # API 客户端（dio）
│   ├── state/                  # Riverpod 状态管理
│   ├── widgets/                # 通用 Widget（自适应）
│   ├── theme/                  # 设计令牌（Material 3 + Cupertino）
│   └── utils/                  # 工具函数
└── pubspec.yaml

apps/desktop/                   # 桌面端入口
├── lib/
│   ├── main.dart
│   ├── features/               # 桌面独有功能
│   │   ├── project_wizard/     # 完整创建向导
│   │   ├── code_editor/        # 代码编辑预览
│   │   ├── server_manager/     # SSH 服务器管理
│   │   ├── multi_window/       # 多窗口管理
│   │   ├── tray/               # 系统托盘
│   │   └── shortcuts/          # 全局快捷键
│   ├── platform/               # 桌面平台特定代码
│   └── shells/                 # 桌面布局
└── pubspec.yaml

apps/mobile/                    # 移动端入口
├── lib/
│   ├── main.dart
│   ├── features/               # 移动独有功能
│   │   ├── status_overview/    # 状态总览
│   │   ├── push_notifications/ # 推送通知
│   │   ├── quick_edit/         # 对话式快速编辑
│   │   ├── biometric_auth/     # 生物识别
│   │   ├── qr_scanner/         # 扫码部署
│   │   └── data_dashboard/     # 简化看板
│   ├── platform/               # 移动平台特定代码
│   └── shells/                 # 移动布局
└── pubspec.yaml
```

---

## 二、技术栈最终选型

### 2.1 后端栈（apps/api）

| 层级 | 选型 | 版本 | 理由 |
|------|------|------|------|
| 运行时 | Node.js | 20 LTS | 长期支持版 |
| HTTP 框架 | Fastify | 5.x | 高性能，比 Express 快 3 倍 |
| API 层 | tRPC + OpenAPI | 11.x + trpc-openapi | 内部 tRPC + 对外 REST 自动生成 |
| 认证 | NextAuth.js (JWT) | v5 | 跨端 JWT 鉴权 |
| ORM | Prisma | 5.x | 类型安全 |
| 数据库 | PostgreSQL | 16 | 主数据库 |
| 缓存/队列 | Redis + BullMQ | 7 / 5 | 异步任务队列 |
| 校验 | Zod | 3.x | schema 即契约 |
| 日志 | pino | 9.x | 结构化日志 |
| 测试 | Vitest | latest | 单测 |

### 2.2 桌面端栈（apps/desktop）

| 层级 | 选型 | 版本 | 理由 |
|------|------|------|------|
| 框架 | Flutter | 3.x (Dart 3) | 编译为原生 x64/ARM64 |
| 状态管理 | Riverpod | 2.x | 类型安全、可测试 |
| 路由 | go_router | latest | 声明式路由 |
| HTTP | dio | 5.x | 拦截器、错误处理 |
| 本地存储 | hive + drift | latest | KV + 关系型 |
| 系统集成 | tray_manager, window_manager, hotkey_manager | latest | 桌面原生能力 |
| 代码编辑 | code_editor / re-editor | latest | 代码编辑组件 |
| 图表 | fl_chart | latest | 数据可视化 |

### 2.3 移动端栈（apps/mobile）

| 层级 | 选型 | 版本 | 理由 |
|------|------|------|------|
| 框架 | Flutter | 3.x (Dart 3) | 与桌面端共享核心 |
| 状态管理 | Riverpod | 2.x | 同桌面端 |
| 路由 | go_router | latest | 同桌面端 |
| 推送 | firebase_messaging + apns | latest | iOS+Android 统一 |
| 生物识别 | local_auth | latest | 指纹/Face ID |
| 扫码 | mobile_scanner | latest | 相机扫码 |
| 相机/相册 | image_picker | latest | 图片选择 |
| 深度链接 | app_links | latest | URL Scheme + Universal Link |
| 本地通知 | flutter_local_notifications | latest | 本地推送 |

### 2.4 Web 端栈（apps/web）

| 层级 | 选型 | 版本 | 理由 |
|------|------|------|------|
| 框架 | Next.js | 15 App Router | 落地页 + 简化控制台 |
| UI | Tailwind + Radix UI | 3 / latest | 快速 UI |
| PWA | Serwist | 9.x | 替代 next-pwa |
| API 客户端 | tRPC Client | 11.x | 类型安全直连后端 |

### 2.5 共享与同步

| 工具 | 用途 |
|------|------|
| OpenAPI 3.0 | tRPC → OpenAPI → Dart 客户端自动生成 |
| openapi-generator-cli | 生成 Dart API 客户端 |
| Zod | 单一 schema 真源，校验 + 类型推导 |
| Figma Tokens | 设计令牌同步至 Dart ThemeData + Tailwind config |

---

## 三、Monorepo 目录结构

```
LynxKit/
├── apps/
│   ├── api/                              # 后端 API 服务
│   │   ├── src/
│   │   │   ├── routes/                   # Fastify 路由
│   │   │   ├── trpc/                     # tRPC 路由
│   │   │   │   ├── routers/              # auth/server/project/template/deploy
│   │   │   │   └── context.ts
│   │   │   ├── auth/                     # NextAuth 配置（JWT 模式）
│   │   │   ├── lib/
│   │   │   │   ├── crypto.ts             # KMS 抽象（AES-GCM + 云 KMS）
│   │   │   │   ├── ssh.ts                # SSH 操作
│   │   │   │   ├── queue.ts              # BullMQ 队列
│   │   │   │   └── logger.ts            # pino 日志
│   │   │   ├── jobs/                     # 后台任务处理器
│   │   │   └── openapi.ts                # OpenAPI 自动生成
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── web/                              # Next.js Web 端（落地页 + PWA）
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (marketing)/          # 落地页
│   │   │   │   ├── (auth)/               # 登录/注册
│   │   │   │   ├── (console)/            # 简化版控制台
│   │   │   │   ├── api/auth/[...nextauth]/
│   │   │   │   └── api/trpc/[trpc]/
│   │   │   ├── components/
│   │   │   └── lib/
│   │   ├── public/
│   │   ├── serwist.config.ts
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   ├── desktop/                          # Flutter 桌面端
│   │   ├── lib/
│   │   │   ├── main.dart
│   │   │   ├── app.dart                   # MaterialApp 配置
│   │   │   ├── features/                  # 桌面独有功能
│   │   │   │   ├── project_wizard/
│   │   │   │   │   ├── wizard_screen.dart
│   │   │   │   │   ├── wizard_controller.dart
│   │   │   │   │   └── widgets/
│   │   │   │   ├── code_editor/
│   │   │   │   ├── server_manager/
│   │   │   │   ├── deploy_logs/
│   │   │   │   ├── multi_window/
│   │   │   │   ├── tray/
│   │   │   │   └── shortcuts/
│   │   │   ├── platform/                  # 平台适配
│   │   │   │   ├── windows/
│   │   │   │   ├── macos/
│   │   │   │   └── linux/
│   │   │   └── shells/
│   │   │       ├── desktop_shell.dart     # NavigationRail 布局
│   │   │       └── widgets/
│   │   ├── windows/                       # Windows 平台
│   │   ├── macos/                         # macOS 平台
│   │   ├── linux/                         # Linux 平台
│   │   ├── assets/
│   │   ├── pubspec.yaml
│   │   └── README.md
│   │
│   └── mobile/                           # Flutter 移动端
│       ├── lib/
│       │   ├── main.dart
│       │   ├── app.dart
│       │   ├── features/                 # 移动独有功能
│       │   │   ├── status_overview/
│       │   │   ├── push_notifications/
│       │   │   ├── quick_edit/
│       │   │   ├── biometric_auth/
│       │   │   ├── qr_scanner/
│       │   │   └── data_dashboard/
│       │   ├── platform/
│       │   │   ├── ios/
│       │   │   └── android/
│       │   └── shells/
│       │       ├── mobile_shell.dart     # BottomNavigationBar 布局
│       │       └── widgets/
│       ├── ios/                          # iOS 平台
│       ├── android/                      # Android 平台
│       ├── assets/
│       ├── pubspec.yaml
│       └── README.md
│
├── packages/
│   ├── flutter_core/                    # Flutter 共享核心库
│   │   ├── lib/
│   │   │   ├── models/                  # OpenAPI 生成的数据模型
│   │   │   ├── services/                # API 客户端
│   │   │   │   ├── api_client.dart       # dio 封装
│   │   │   │   ├── auth_service.dart
│   │   │   │   ├── project_service.dart
│   │   │   │   ├── server_service.dart
│   │   │   │   └── deploy_service.dart
│   │   │   ├── state/                    # Riverpod providers
│   │   │   ├── widgets/                 # 通用 Widget
│   │   │   │   ├── project_card.dart
│   │   │   │   ├── server_card.dart
│   │   │   │   ├── status_badge.dart
│   │   │   │   └── empty_state.dart
│   │   │   ├── theme/
│   │   │   │   ├── app_theme.dart        # Material 3 ThemeData
│   │   │   │   ├── app_colors.dart
│   │   │   │   └── app_typography.dart
│   │   │   └── utils/
│   │   ├── pubspec.yaml
│   │   └── README.md
│   │
│   ├── templates/                       # 模板基座库（用户生成产品的模板）
│   │   ├── _base/
│   │   │   ├── components/
│   │   │   │   ├── ui/
│   │   │   │   ├── layout/
│   │   │   │   ├── auth/
│   │   │   │   ├── user/
│   │   │   │   └── data/
│   │   │   ├── lib/
│   │   │   ├── prisma/base.schema.prisma
│   │   │   ├── Dockerfile
│   │   │   ├── docker-compose.yml
│   │   │   └── Caddyfile
│   │   ├── static-site/
│   │   ├── service-booking/
│   │   ├── content-publish/
│   │   ├── light-commerce/
│   │   ├── event-manage/
│   │   └── admin-dashboard/
│   │
│   ├── agent-core/                      # Agent 编排引擎
│   │   ├── src/
│   │   │   ├── agents/
│   │   │   │   ├── intent.ts
│   │   │   │   ├── clarify.ts
│   │   │   │   ├── select.ts
│   │   │   │   ├── fill.ts
│   │   │   │   ├── build.ts
│   │   │   │   ├── fix.ts
│   │   │   │   └── deploy.ts
│   │   │   └── providers/
│   │   └── package.json
│   │
│   ├── deployer/                        # 部署模块
│   │   ├── src/
│   │   │   ├── ssh.ts
│   │   │   ├── docker.ts
│   │   │   ├── caddy.ts
│   │   │   ├── sandbox.ts
│   │   │   └── health.ts
│   │   └── package.json
│   │
│   └── shared/                          # TypeScript 共享
│       ├── src/
│       │   ├── types/
│       │   ├── constants/
│       │   ├── utils/
│       │   └── crypto.ts
│       └── package.json
│
├── docker-compose.dev.yml               # 本地开发（PG + Redis）
├── .env.example
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
├── .gitignore
├── .gitattributes
└── README.md
```

---

## 四、本次实现范围

### 4.1 完整实现（Week 1，可运行）

| 模块 | 功能点 | 验收标准 |
|------|--------|----------|
| **Monorepo 骨架** | pnpm workspace + Turborepo + TypeScript | `pnpm install` 跑通 |
| **后端 API** | Fastify + tRPC + Prisma + BullMQ | `pnpm dev:api` 启动，端口 4000 |
| **数据库** | 完整 Prisma Schema（6 张表） | `pnpm db:push` 成功 |
| **认证** | JWT 邮箱+密码 注册/登录 | 跨端通用 JWT |
| **OpenAPI 自动生成** | tRPC → OpenAPI spec | `/openapi.json` 可访问 |
| **Flutter 共享核心** | flutter_core 包：models + services + state + theme | `flutter pub get` 通过 |
| **Flutter Desktop 骨架** | 主窗口 + NavigationRail + 路由 + 5 个核心页面骨架 | `flutter run -d windows` 启动 |
| **Flutter Mobile 骨架** | BottomNav + 路由 + 5 个核心页面骨架 | `flutter run -d android` 启动 |
| **Next.js Web** | 落地页 + 登录页 + 简化控制台 + PWA | `pnpm dev:web` 启动 |
| **本地开发环境** | docker-compose.dev.yml（PG+Redis） | 一键启动依赖 |

### 4.2 桌面端核心页面骨架（Flutter Desktop）

1. **登录窗口** — 邮箱密码登录
2. **主控台** — 项目列表 + 服务器列表 + 数据统计
3. **项目创建向导** — 6 类产品选择 + AI 对话占位
4. **服务器管理** — 添加表单 + SSH 测试 + Docker 状态
5. **设置** — 用户资料 + 应用配置
6. **系统托盘** — 常驻 + 快捷操作菜单

### 4.3 移动端核心页面骨架（Flutter Mobile）

1. **登录页** — 邮箱密码 + 生物识别占位
2. **状态总览** — 项目卡片 + 下拉刷新
3. **项目详情** — 状态 + 快速编辑入口
4. **服务器状态** — 只读列表
5. **我的** — 资料 + 通知设置
6. **扫码部署** — 相机扫码占位

### 4.4 业务骨架（接口 + 目录，留待 Week 2-4 填充）

| 模块 | 状态 | 说明 |
|------|------|------|
| 模板引擎 | 接口 + static-site 完整基座 | template.json 标准格式已定 |
| Agent 编排 | 7 个 Agent 文件骨架 + 接口 | ④⑤⑥⑦ 留 TODO |
| 部署模块 | ssh.ts / docker.ts / caddy.ts 接口 | 实际逻辑待填 |
| _base 共享层 | 目录结构 + 占位组件 | 模板复用基础 |
| 6 个模板目录 | 全部创建 + template.json 元数据 | 业务代码后续填充 |
| OpenAPI → Dart codegen | 脚本 + 配置 | 手动触发，CI 自动化 Phase 2 |

### 4.5 不在本次范围

- Claude API 真实调用（接口已留，mock 实现）
- 真实 Docker 编译沙箱（接口已留）
- 6 个模板的完整业务代码（仅 static-site 完整 + 其余占位）
- iOS 构建（需 macOS，仅源码就绪）
- 应用商店上架（Phase 2）
- 推送服务真实集成（占位配置）
- 单元测试（Phase 2）

---

## 五、数据库 Schema（平台库）

按产品文档 §9.1 落地，6 张表：
- `User` — 平台用户（含 deviceToken 字段，用于推送）
- `Server` — 用户服务器（SSH 凭证 AES-GCM 加密）
- `Project` — 用户产品项目
- `ProjectVersion` — 版本快照
- `DeployLog` — 部署日志
- `Template` — 平台模板注册表

---

## 六、实现步骤（按顺序执行）

1. **根目录配置** — package.json, pnpm-workspace, turbo.json, tsconfig.base, .gitignore, .gitattributes
2. **本地开发依赖** — docker-compose.dev.yml（PG + Redis）
3. **共享包** — packages/shared（类型、常量、工具、KMS 抽象）
4. **后端 API** — apps/api（Fastify + tRPC + Prisma + NextAuth JWT + BullMQ）
   - 4.1 应用骨架 + 配置
   - 4.2 Prisma Schema 完整定义
   - 4.3 NextAuth JWT 配置（支持多端鉴权）
   - 4.4 tRPC 路由（auth/server/project/template/deploy）
   - 4.5 OpenAPI 自动生成
   - 4.6 SSH 测试连接实现
   - 4.7 KMS 加密实现
5. **Flutter 共享核心** — packages/flutter_core（models + services + state + theme + widgets）
6. **Flutter Desktop** — apps/desktop（主窗口 + NavigationRail + 5 个页面 + 系统托盘）
7. **Flutter Mobile** — apps/mobile（BottomNav + 5 个页面 + 路由）
8. **Next.js Web** — apps/web（落地页 + 登录 + 简化控制台 + PWA）
9. **模板包** — packages/templates（_base + 6 模板 + static-site 完整基座）
10. **Agent 编排骨架** — packages/agent-core
11. **部署模块骨架** — packages/deployer
12. **README + .env.example**
13. **创建 Gitee 仓库 LynxKit** + 推送

---

## 七、关键设计决策

### 7.1 跨端鉴权：JWT 策略

```
用户登录（任意端） → Backend 签发 JWT (HS256)
   ↓
桌面端：本地存储 JWT + 自动续期
移动端：安全存储 (Keychain/Keystore) + 生物识别解锁
Web 端：HTTP-only Cookie + SameSite
```

### 7.2 类型契约同步

```typescript
// apps/api/src/trpc/routers/project.ts
export const projectRouter = t.router({
  list: t.procedure
    .input(z.object({ page: z.number().optional() }))
    .output(z.array(ProjectSchema))
    .query(/* ... */),
});

// 自动生成 OpenAPI spec → openapi-generator → Dart 客户端
// 前后端类型完全一致，编译期检查
```

### 7.3 Flutter 自适应布局

```dart
// packages/flutter_core/lib/widgets/responsive_scaffold.dart
class ResponsiveScaffold extends StatelessWidget {
  Widget build(context) {
    return LayoutBuilder(builder: (context, constraints) {
      if (constraints.maxWidth >= 1024) {
        return DesktopShell(child: child);     // NavigationRail
      } else if (constraints.maxWidth >= 600) {
        return TabletShell(child: child);      // 折叠侧栏
      } else {
        return MobileShell(child: child);      // BottomNav
      }
    });
  }
}
```

### 7.4 桌面端多窗口

```dart
// apps/desktop/lib/features/multi_window/window_manager.dart
class ProjectWindow {
  static Future<void> open(String projectId) async {
    await DesktopMultiWindow.createWindow(jsonEncode({
      'type': 'project_detail',
      'projectId': projectId,
    }));
  }
}
```

### 7.5 移动端推送

```
Backend → 推送服务（Firebase Cloud Messaging）
   ↓
iOS: APNs 通道
Android: FCM 通道
   ↓
App 接收推送 → 显示通知 → 点击跳转深度链接
```

### 7.6 SSH 凭证加密

```typescript
// packages/shared/src/crypto.ts
interface KMS {
  encrypt(plain: string): Promise<string>;
  decrypt(cipher: string): Promise<string>;
}
// 本地实现：AES-256-GCM
// 生产实现：可对接阿里云 KMS / AWS KMS
```

### 7.7 异步任务队列

- `code-generation` 队列 — 代码生成任务
- `deployment` 队列 — 部署任务
- `build-sandbox` 队列 — 编译任务
- 三端通过 SSE / WebSocket / 轮询获取任务状态

---

## 八、风险与对策

| 风险 | 对策 |
|------|------|
| 实现体量极大 | Week 1 聚焦骨架，业务逻辑留 TODO |
| Flutter SDK 未安装 | 检查并引导安装，提供 `install_flutter.md` |
| iOS 构建需 macOS | 仅源码就绪，构建交由 CI 或 macOS 开发者 |
| Windows 路径/换行符 | .gitattributes 强制 LF |
| pnpm + Flutter 工作区混用 | pubspec.yaml 与 package.json 分离，turbo 仅管 TS 任务 |
| OpenAPI → Dart codegen 复杂 | Week 1 先手写 models，自动化 Phase 2 |
| 网络依赖大 | 配置 npmmirror + pub 镜像 |

---

## 九、验收标准

完成后用户应能：

### 9.1 后端
1. `pnpm install` 无错误
2. `docker compose -f docker-compose.dev.yml up -d` 启动 PG+Redis
3. `pnpm dev:api` 启动 API 服务（端口 4000）
4. `pnpm db:push` 创建数据库表
5. `curl http://localhost:4000/openapi.json` 返回 OpenAPI spec
6. 注册/登录 API 可用，返回 JWT

### 9.2 Flutter Desktop
7. `cd apps/desktop && flutter pub get` 通过
8. `flutter run -d windows` 启动桌面应用
9. 可看到登录窗口 → 登录后进入主控台
10. NavigationRail 导航 5 个页面
11. 系统托盘可见，右键菜单可用

### 9.3 Flutter Mobile
12. `cd apps/mobile && flutter pub get` 通过
13. `flutter run -d android`（需 Android 模拟器/真机）启动
14. BottomNav 切换 5 个页面
15. 登录后看到状态总览

### 9.4 Web
16. `pnpm dev:web` 启动（端口 3000）
17. 落地页可见
18. 登录后进入简化控制台
19. PWA 可安装到主屏

### 9.5 Git
20. 仓库已推送到 Gitee `LynxKit`
