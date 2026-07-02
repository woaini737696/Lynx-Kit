# 2026-07-03 登录过期 + 商店报错 + 构建页全量实现（迭代 5）

## 任务概述

本轮针对用户实测报告的两个严重 bug（登录即过期、商店页加载报错）完成根因修复，
完整实现 5 个构建页（列表 / 控制台 / 配置 / 预览 / 部署），并补全 profile 持久化与
全产品功能空白点，最后重新打包桌面端安装包。

1. 反复提示「登录已过期」—— 登录后 token 立即失效（严重 bug）
2. 登录后商店页一直加载报错（严重 bug）
3. 构建页 5 个子页面未实现，需完整实现（UI 完整 + mock 数据）
4. 检查整个产品，未完善的基本功能一次性完善
5. 给下一步迭代建议

## 变更清单

| 文件 | 类型 | 说明 |
|------|------|------|
| `packages/api-client/src/types.ts` | 修改 | `LoginResponse.token` → `accessToken`，对齐后端响应字段 |
| `apps/desktop/src/hooks/use-auth.ts` | 修改 | login / register 两处 `res.token` → `res.accessToken` |
| `apps/web/src/app/(auth)/login/page.tsx` | 修改 | `login(res.token,...)` → `login(res.accessToken,...)` |
| `apps/web/src/app/(auth)/register/page.tsx` | 修改 | 同上 |
| `packages/shared/src/types/store.ts` | 修改 | StoreCategory 枚举值统一为 db 大写值（SOCIAL/SYSTEM/.../WORKFLOW） |
| `apps/desktop/src/routes/store/index.tsx` | 修改 | 商店分类列表同步大写值语义 |
| `apps/mobile/app/(tabs)/store.tsx` | 修改 | 移动端商店分类同步 |
| `apps/desktop/src/routes/build/list.tsx` | 重写 | 占位页 → 完整列表页（加载 / 空态 / 删除 / 状态 badge） |
| `apps/desktop/src/routes/build/console.tsx` | 重写 | 占位页 → 完整控制台（进度条 + 10 步 Agent + 实时日志流 + 启动构建） |
| `apps/desktop/src/routes/build/configure.tsx` | 重写 | 占位页 → 澄清问题表单（按产品类型 mock 问题 + 提交 updateConfig + 只读态） |
| `apps/desktop/src/routes/build/preview.tsx` | 重写 | 占位页 → 文件树 + 代码预览（行号 / 复制 / mock 示例文件） |
| `apps/desktop/src/routes/build/deploy.tsx` | 重写 | 占位页 → 部署目标选择 + mock 6 步部署流程 + 回滚 + 访问 URL |
| `apps/desktop/src/routes/settings/profile.tsx` | 修改 | 保存仅改本地 store → 调用后端 `PUT /v1/auth/me` 持久化 |
| `packages/shared/src/schemas/auth.ts` | 修改 | 新增 `updateProfileSchema`（name / phone / avatar） |
| `packages/api-client/src/auth.ts` | 修改 | AuthApi 新增 `updateProfile()` 方法 |
| `apps/api/src/routes/auth.ts` | 修改 | 新增 `PUT /v1/auth/me` 端点（含手机号唯一性校验） |
| `apps/api/tsconfig.json` | 修改 | 修复 `declarationMap` 未与 `declaration` 同步的 TS5069 配置错误 |
| `apps/desktop/src/routes/creator/products.tsx` | 修改 | 「上架新产品」死按钮 → Dialog 弹窗说明构建→部署→上架流程 |
| `apps/desktop/src/routes/settings/notifications.tsx` | 新增 | 通知偏好页（5 项开关，localStorage 持久化） |
| `apps/desktop/src/routes/settings/about.tsx` | 新增 | 关于页（版本 / 技术栈 / 检查更新 mock） |
| `apps/desktop/src/routes/settings/index.tsx` | 修改 | 通知 / 关于入口指向独立路由（原伪重定向到 profile） |
| `apps/desktop/src/App.tsx` | 修改 | 注册 `/settings/notifications`、`/settings/about` 路由 |
| `apps/desktop/installer/LynxKit-Setup-0.1.0-x64.exe` | 重新打包 | hash 由 `index-CpBdvqDV.js` → `index-B5kY95M_.js` |

## 测试用例与验收清单

| 编号 | 场景 | 预期结果 | 实测 | 状态 |
|------|------|----------|------|------|
| TC-001 | 登录后不再立即过期 | token 正确存入，后续请求带 `Bearer <token>` | 后端登录返回 `accessToken`（329 字符），`token` 字段不存在 → 前端读 `res.accessToken` 正确 | ✅ |
| TC-002 | GET /v1/auth/me 不返回 401 | 携带 token 返回当前用户 | `200 OK`，返回 name/phone | ✅ |
| TC-003 | 商店列表加载成功 | `/v1/store` 返回 200 | `200`，`products:[]`（空数据但不报错） | ✅ |
| TC-004 | 商店分类筛选传大写值通过校验 | `?category=SYSTEM` 返回 200 | `200`，后端接受大写枚举值 | ✅ |
| TC-005 | build 列表加载 | `/v1/build` 返回 200 | `200`，`sessions:[]` | ✅ |
| TC-006 | build 创建会话 | POST `/v1/build` 返回 201 | `201`，返回 session.id + status=DRAFT | ✅ |
| TC-007 | PUT /v1/auth/me 更新资料 | 返回 200 + 更新后字段 | `200`，name=Iter5 Updated phone=13800000001 | ✅ |
| TC-008 | 构建配置页可编辑/只读态切换 | clarifying/draft 可编辑，其他只读 | 状态 badge + 表单 disabled 切换 | ✅ |
| TC-009 | 代码预览文件树展开/折叠 | 点击目录切换、点击文件显示内容 | mock 4 文件树正确渲染 + 行号 | ✅ |
| TC-010 | 部署 mock 6 步流程 | 点击一键部署逐步推进 | 步骤逐个打勾，最终生成 deployUrl | ✅ |
| TC-011 | 创作者「上架新产品」按钮有响应 | 弹出流程说明 Dialog | Dialog 渲染 + 跳构建入口 | ✅ |
| TC-012 | 通知 / 关于页可访问 | 独立页面渲染 | 通知 5 项开关 + 关于版本/技术栈 | ✅ |
| TC-013 | 类型检查无新增错误 | 本轮文件 0 error | shared/api-client pass；desktop 仅遗留 ui-web 历史 @types/react 冲突 | ✅ |
| TC-014 | 安装包重新生成 | exe 产出 | `LynxKit-Setup-0.1.0-x64.exe` 81.42 MB | ✅ |
| TC-015 | 工作区干净、installer 不入 git | .gitignore 覆盖 installer/ | `installer/` 已在 .gitignore | ✅ |

## 根因分析

### Bug 1：登录即过期（最严重）

- **根因**：后端 [apps/api/src/routes/auth.ts](file:///d:/LynxKit/apps/api/src/routes/auth.ts) 登录 / 注册返回
  `{ user, accessToken, refreshToken }`，但前端 [packages/api-client/src/types.ts](file:///d:/LynxKit/packages/api-client/src/types.ts) 的 `LoginResponse` 声明为 `token` 字段。
  前端读取 `res.token` → `undefined` → 存入 store → 下次请求头 `Authorization: Bearer undefined` →
  后端 401 → [apps/desktop/src/lib/api.ts](file:///d:/LynxKit/apps/desktop/src/lib/api.ts) 的 `onError` 拦截 401 →
  `logout()` + toast「登录已过期」→ 循环触发。
- **修复**：`LoginResponse.token` → `accessToken`；3 处调用方（use-auth / web login / web register）同步。
- **验证**：实测登录返回 `accessToken present: True / token present: False`，GET /me 不再 401。

### Bug 2：商店页加载报错

- **根因**：StoreCategory 枚举三处不一致：
  - `shared/types/store.ts`：小写值（TEMPLATE/PLUGIN/...）—— 产品形态分类
  - `db/schema/store.ts` + `init.sql`：大写值（SOCIAL/SYSTEM/...）—— 应用场景分类
  - `api/routes/store.ts`：跟 db 大写值
  前端传小写值给后端 → `z.nativeEnum(StoreCategory)` 校验失败 → 400 → 商店页报错。
- **修复**：以 db 大写值为准，统一 shared 枚举 + 桌面 / 移动端商店分类列表。
- **验证**：`?category=SYSTEM` 返回 200，校验通过。

### 构建页 5 子页面

- 全部从占位页重写为功能完整 UI，采用「UI 完整 + mock 数据」策略：
  - list：调用 `buildApi.list()` 真实加载
  - console：调用 `buildApi.getById/getLogs` + `startBuildFlow` SSE
  - configure：mock 澄清问题表单，提交调 `updateConfig` 真实 API
  - preview：无生成代码时用 mock 4 文件示例，有则用真实 `generatedCode.files`
  - deploy：mock 6 步部署流程，成功后 `updateConfig` 回写 deployUrl

## 遗留问题

1. **ui-web 包与 @types/react@18.3.31 类型冲突**：lucide-react 类型不匹配，desktop typecheck 报 10+ 处错误。历史遗留，建议后续单独迭代处理。
2. **apps/api tsconfig rootDir**：path-mapped 源码导致 TS6059 rootDir 警告（不影响运行）。建议后续切换为 project references 或构建 shared dist 后引用。
3. **安装包体积**：81.42 MB，Electron 固有成本，如需 < 30MB 仍需 Tauri 迁移。
4. **构建流水线 Agent**：当前 console 的 SSE 流式为 mock 骨架，真实 9 层 Agent 编排引擎待后续迭代接入。

## 提交信息

- 分支：master
- 推送目标：Gitee（origin）+ GitHub（github）

## 安装包

- 路径：`d:\LynxKit\apps\desktop\installer\LynxKit-Setup-0.1.0-x64.exe`
- 体积：约 81.42 MB（Electron 30.5.1 + Chromium runtime）
