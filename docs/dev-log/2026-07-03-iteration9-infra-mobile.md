# 2026-07-03 基础设施 + 移动端补齐（迭代 9）

## 任务概述

继续实现 P0~P2 任务清单，聚焦：
- **服务器基础设施**：PostgreSQL 15 + pgvector 安装、nginx 静态更新源
- **Sentry 错误监控**：API 端 captureException + telemetry 路由 + desktop 轻量级 sentry.ts
- **CI 流水线增强**：artifact 上传 + 构建产物大小摘要
- **i18n 剩余页面**：store/build 页面接入
- **Web Vitals 上报**：批量上报到后端 API
- **移动端功能补齐**：通知设置、关于页、ErrorBoundary、商店搜索、构建删除、商品详情增强

## 服务器零构建硬约束遵守

所有服务器操作严格遵守"零构建"约束：
- PostgreSQL + pgvector：`apt install`（允许）
- 数据库迁移：本地 `scp` SQL 文件 + 服务器 `psql` 执行（非 npm/pnpm）
- nginx 配置：直接写配置文件（允许）
- 无任何 `npm install` / `pnpm build` / `tsx` 操作在服务器执行

## 变更清单

### t2: P0-1 9 层 Agent 流水线 mock 集成测试
- 修复 `packages/agent-core/src/orchestrator.test.ts` 5 个测试
- mock tools/index 模块 + makeMockContext 添加 workspace 字段
- 用 `"deployer" in overrides` 替代 `??` 区分"未传"与"显式传 undefined"

### t3: P0-2 构建会话全链路验证
- 新建 `apps/api/src/lib/build-runner.test.ts`，4 个测试覆盖 processBuildJob 全路径
- vi.hoisted 共享可控 mock，mock Orchestrator/db/logger

### t4: P1-2 CI 增加 desktop build 验证
- `.github/workflows/ci.yml` 添加 artifact 上传（web-build + desktop-build）
- 追加构建产物大小摘要步骤

### t5: P1-3 Sentry 错误监控接入
- `apps/api/src/middleware/error.ts`：提取 captureException 为导出函数
- `apps/api/src/routes/telemetry.ts`：POST /errors + POST /vitals 路由
- `apps/desktop/src/lib/sentry.ts`：轻量级客户端错误上报（fire-and-forget fetch）
- `apps/desktop/src/components/error-boundary.tsx`：componentDidCatch 调用 captureError

### t6: P1-4 服务器安装 pgvector + 语义检索验证
- 安装 PostgreSQL 15 + pgvector 0.8.4
- 创建 lynxkit 数据库/用户（密码 LynxKit2026Prod）
- 本地 scp 迁移 SQL + psql 执行（11 张表迁移成功）
- vector(1024) 列 + ivfflat 索引就绪
- cosine 相似度搜索端到端验证通过

### t7: P2-1 服务器搭建 nginx 静态更新源
- nginx 独立 8090 端口服务 `/var/www/lynxkit-updates/`
- placeholder latest.yml 已部署（Content-Type: text/yaml + CORS + Range）
- `apps/desktop/electron/services/auto-updater.ts` 默认 URL 更新为 `http://47.119.185.135:8090/lynxkit/`
- `apps/desktop/electron-builder.yml` publish.url 同步更新

### t8: P2-2 i18n 剩余页面接入
- `apps/desktop/src/routes/store/index.tsx`：硬编码中文替换为 t() 调用
- `apps/desktop/src/routes/build/list.tsx`：同上
- `apps/desktop/src/i18n/messages/zh.json` + `en.json`：新增 store/build 命名空间键

### t9: P2-3 Web Vitals 上报到后端 API
- `apps/desktop/src/lib/web-vitals.ts`：新增 reportToApi() 批量上报到 /telemetry/vitals

### t10: P2-4 移动端功能补齐（不升级 SDK）
- 新建 `apps/mobile/app/settings/notifications.tsx`：通知偏好开关（AsyncStorage 持久化）
- 新建 `apps/mobile/app/settings/about.tsx`：版本号 + 技术栈 + 检查更新
- 新建 `apps/mobile/src/components/error-boundary.tsx`：全局 ErrorBoundary（class component）
- `apps/mobile/app/settings/index.tsx`：wire up 空操作 handler
- `apps/mobile/app/_layout.tsx`：注册新路由 + ErrorBoundary 包裹
- `apps/mobile/app/(tabs)/store.tsx`：搜索框 + 500ms 防抖
- `apps/mobile/app/(tabs)/build.tsx`：删除构建（Alert 二次确认）
- `apps/mobile/app/store/[productId].tsx`：coverUrl 图片 + version 徽章 + repoUrl 链接 + alipay 支付
- `packages/api-client/src/store.ts`：修复 StoreApi.list 不传 q 参数

## 测试结果

| 检查项 | 结果 |
|--------|------|
| pnpm -r test | ✅ 14 项目全过（exit 0） |
| pnpm -r typecheck | ⚠️ packages/deployer TS6059（已知 P1-5 deferred） |
| 其余包 typecheck | ✅ 全过 |

## 服务器环境

| 组件 | 版本/状态 |
|------|-----------|
| PostgreSQL | 15.x online on :5432 |
| pgvector | 0.8.4 |
| nginx | 1.18.0 (update source on :8090) |
| lynxkit DB | 11 表迁移完成 |
| ivfflat index | store_products_embeddings 已创建 |

## 已知遗留

- P1-5 TS6059 rootDir（packages/deployer）仍 deferred，需 TypeScript project references 迁移
- 服务器 latest.yml 为 placeholder，待 t12 打包后替换为真实安装包
- 移动端 i18n 未接入（60+ 硬编码中文字符串，留待下轮）
