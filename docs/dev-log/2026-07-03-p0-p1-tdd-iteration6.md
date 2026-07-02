# 2026-07-03 P0-P1 TDD 全流程实现（迭代 6）

## 任务概述

本轮严格按 DEVELOPMENT.md 规范，对 P0-P1 优先级清单进行 TDD 实现。
针对用户明确指出的「上一次任务没有走测试流程，严重违反规范」问题，
本轮**每一个新功能均按 RED → GREEN → REFACTOR 三阶段交付**，
所有代码必须通过测试才提交。

1. P0-2：构建→部署→上架全链路打通（deploy.tsx 上架按钮 + Dialog）
2. P0-3：移动端功能对齐（profile 编辑页）
3. P1-4：ui-web 类型冲突（上一轮已修复）
4. P1-5/P1-6：评估后延后（需 TS project references 迁移 / Playwright E2E）

## TDD 合规说明

本轮所有新增逻辑均严格走完测试流程：

| 阶段 | 功能 | RED | GREEN | REFACTOR |
|------|------|-----|-------|----------|
| 阶段 3 | publish-form（上架表单校验 + payload 构造） | 19 测试因模块不存在失败 | TC-406 发现 `Number("")===0` 空字符串 bug，修复后 19 全过 | deploy.tsx 集成纯函数 + Dialog UI |
| 阶段 4 | profile-form（个人资料校验 + patch 构造） | 16 测试因模块不存在失败 | 16 测试一次通过 | 新建 mobile /settings/profile.tsx |

**关键发现**：TC-406 测试用例在 GREEN 阶段捕获了一个真实 bug ——
`Number("")` 在 JavaScript 中返回 `0` 而非 `NaN`，导致空价格被误判为有效。
这正是 TDD 的价值：测试先于实现，迫使开发者思考边界条件。

## 变更清单

| 文件 | 类型 | 说明 |
|------|------|------|
| `apps/desktop/src/lib/publish-form.ts` | 新增 | 上架表单纯逻辑：`validatePublishForm` + `buildPublishPayload` |
| `apps/desktop/src/lib/publish-form.test.ts` | 新增 | TDD 测试，19 用例（TC-401~TC-419） |
| `apps/desktop/src/routes/build/deploy.tsx` | 修改 | 集成 publish-form：上架按钮 + Dialog 表单 + 提交跳转 |
| `apps/mobile/src/lib/profile-form.ts` | 新增 | 个人资料表单纯逻辑：`validateProfileForm` + `buildProfilePatch` |
| `apps/mobile/src/lib/profile-form.test.ts` | 新增 | TDD 测试，16 用例（TC-501~TC-516） |
| `apps/mobile/app/settings/profile.tsx` | 新增 | 移动端个人资料编辑页（name/phone 表单 + 校验 + 持久化） |
| `apps/mobile/app/_layout.tsx` | 修改 | 注册 `/settings/profile` 路由（标题"编辑个人资料"） |
| `apps/mobile/app/settings/index.tsx` | 修改 | "个人资料"入口指向 `/settings/profile`（原指 `/(tabs)/profile` 只读页） |

## 测试结果

```
Test Files  8 passed (8)
     Tests  55 passed (55)
  Duration  940ms
```

测试文件分布：

| 测试文件 | 用例数 | 覆盖范围 |
|----------|--------|----------|
| `apps/api/src/lib/build-service.test.ts` | 3 | 构建入队 / 同步降级（上轮） |
| `apps/api/src/lib/clarify-service.test.ts` | 3 | 澄清问题生成（上轮） |
| `apps/api/src/lib/publish-service.test.ts` | 4 | 上架服务（上轮） |
| `apps/desktop/src/lib/publish-form.test.ts` | 19 | **本轮新增** — 上架表单校验 + payload |
| `apps/mobile/src/lib/profile-form.test.ts` | 16 | **本轮新增** — 个人资料表单校验 + patch |
| `packages/agent-core/src/agents/01-intent.test.ts` | 4 | IntentAgent（上轮） |
| `packages/agent-core/src/agents/02-architect.test.ts` | 2 | ArchitectAgent（上轮） |
| `packages/agent-core/src/agents/03-clarify.test.ts` | 4 | ClarifyAgent（上轮） |

## Typecheck 状态

- `apps/desktop`：✅ 通过（本轮新增 publish-form.ts + deploy.tsx 改动无新错误）
- `apps/mobile`：9 个**预存**错误（本轮未引入新错误，已通过 git stash 验证）
- `apps/api`：64 个 TS6059 + 若干预存错误（P1-5 范围，见下文）

## P1-5 / P1-6 评估与延后说明

### P1-5：apps/api tsconfig rootDir 修复（延后）

**问题**：`apps/api/tsconfig.json` 的 `rootDir: "./src"` 与根 `tsconfig.base.json` 的
path mapping（`@lynxkit/* → packages/*/src/index.ts`）冲突，导致 64 个 TS6059 错误
（path-mapped 源文件不在 rootDir 下）。

**尝试**：移除 `rootDir` + 设置 `noEmit: true`。
- TS6059 消失 ✅
- 但 TypeScript 开始完整类型检查 `packages/*/src` 源文件，暴露 190 个**真实类型错误**
  （TS2322/TS2769/TS2345 等，这些是包源码自身的类型问题，从 api 视角检查时暴露）
- 总错误数从 254（64 TS6059 + 190 隐藏）变为 190，但错误性质从"噪音"变为"真实类型错"

**结论**：正确修复需要迁移到 **TypeScript project references**，
让每个 package 独立类型检查，api 仅引用其构建产物（dist + .d.ts）。
这涉及：
1. 所有 `packages/*/package.json` 的 `main`/`exports` 从 `src/index.ts` 改为 `dist/index.js`
2. 所有 `packages/*/tsconfig.json` 启用 `composite: true`
3. `apps/api/tsconfig.json` 添加 `references` 字段
4. 确保 turbo build 顺序正确

风险较大，本轮不草率交付，延后到专项迭代。

### P1-6：Playwright E2E（延后）

需安装 `@playwright/test`（重型依赖）+ 浏览器二进制 + 编写 E2E 测试脚本。
本轮 55 个单元测试已覆盖核心业务逻辑，E2E 作为补充延后。

## 功能交付说明

### P0-2：构建→部署→上架全链路

桌面端部署页（`deploy.tsx`）部署成功后，新增「上架到商店」区块：
- 点击「上架到商店」按钮 → 打开 Dialog 表单
- 表单预填：名称（取 userInput 前 40 字）、简介、分类（按 productType 推断）、
  定价类型（默认 FREE）、演示地址（取 deployUrl）
- 用户可修改：名称 / 简介 / 分类 / 定价类型 / 价格 / 标签 / 版本 / 演示地址
- 提交前调用 `validatePublishForm` 校验，错误就地显示
- 校验通过后调用 `storeApi.publish()` → 后端 `POST /v1/store/publish`
  → `publishBuildToStore` 服务（已在上轮 TDD 实现，4 测试覆盖）
- 成功后 toast 提示「已上架到商店（待审核）」+ 跳转到 `/store/:productId`

### P0-3：移动端 profile 编辑页

新增 `apps/mobile/app/settings/profile.tsx`：
- 头像预览（取用户名首字母）
- 用户名输入（2-32 字校验）
- 邮箱只读展示
- 手机号输入（11 位中国大陆格式校验）
- 提交前调用 `validateProfileForm` 校验
- `buildProfilePatch` 只提交变更字段（避免空值覆盖）
- 调用 `authApi.updateProfile()` → 后端 `PUT /v1/auth/me`
- 成功后同步本地 store + 触觉反馈 + 返回上一页

## 下一步建议

1. **P1-5 专项迭代**：迁移 TypeScript project references，根治 TS6059
2. **P1-6 E2E 补全**：Playwright 覆盖关键用户路径（登录→构建→部署→上架）
3. **P2 体验优化**：移动端 build 列表页骨架屏、desktop 上架成功后的产品预览
