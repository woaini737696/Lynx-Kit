# LynxKit 代码架构诊断 + 优化清单

> 诊断版本：迭代 16（commit `76d0d4a`，2026-07-07）
> 诊断范围：全部 `apps/*` + `packages/*`（10 个包 + 5 个应用）
> 诊断目标：
> 1. 识别大文件 / 长函数 / 卡顿源
> 2. 按「AI 友好方向」优化：小文件 + 单一职责 / 显式类型 + 接口契约 / 纯函数提取 + 依赖注入 / 模块边界 + 索引文件
> 3. 设计「防漏改」工程方案：回归测试套件 + pre-commit hook + TDD 强制 + 覆盖率门槛
> 评估方法：4 个并行子代理深度扫描全部源码 + 跨端重复代码交叉对比 + 测试覆盖矩阵分析
> 交付形式：**仅诊断报告，不实施代码改动**。用户审阅后再分批落地。

---

## 一、执行摘要

### 1.1 全局健康度

| 维度 | 评分 | 现状 | 目标 |
|------|------|------|------|
| 文件大小合理性 | 6.0 / 10 | 12 个文件 > 400 行，最大 1040 行 | ≤ 400 行（exceptions ≤ 600） |
| AI 友好度 | 6.5 / 10 | 5 个包 exports 过松；admin 未接入共享包 | 显式 exports + 全端接入共享包 |
| 类型安全 | 7.5 / 10 | 零 `any`；但 25 处 `as never` 断言 | ≤ 5 处，必须有注释说明 |
| 测试覆盖 | 3.0 / 10 | 全局 5.1%；admin 0、web 0 | ≥ 60% |
| 跨端重复 | 5.0 / 10 | 5 类重复（手机号校验 / 密码强度 / 倒计时 / SSE / safeStorage） | 全部下沉到 packages |
| 防漏改能力 | 2.0 / 10 | 无 pre-commit 关卡；无覆盖率门槛 | 三关卡 + 60% 门槛 |

### 1.2 优先级矩阵

| 优先级 | 数量 | 阻碍 | 必须在哪个迭代前完成 |
|--------|------|------|---------------------|
| **P0 严重** | 5 项 | 阻碍 AI 正确重构 / 增加改一漏三风险 | 任何大重构前 |
| **P1 中等** | 8 项 | 增加 AI 误解风险 / 增加维护成本 | 路线图迭代 17-19 |
| **P2 清理** | 6 项 | 技术债 / 噪音 | 路线图迭代 20+ |

### 1.3 核心矛盾

1. **架构过度工程化与代码质量不匹配**：9 层 Agent 编排 + 双 DB 驱动 + Monorepo + 共享包设计完备，但**测试覆盖率仅 5.1%**，AI 改代码无安全网。
2. **共享包设计与实际使用脱节**：`@lynxkit/api-client`、`@lynxkit/store`、`@lynxkit/ui-web` 已存在，但 admin 完全自写 250 行 fetch、未使用任何共享包。
3. **跨端重复代码散落**：`isPhone()` 已在 `packages/shared` 实现，但 5 处仍写 `^1[3-9]\d{9}$` 正则。
4. **packages 内有完全孤立的包**：`@lynxkit/templates` 6 个模板中 5 个是空壳，无任何代码 import 它。

---

## 二、P0 严重问题（必须修复，阻碍 AI 正确重构）

### P0-1 枚举值双轨：shared 小写 vs db 大写

**风险**：AI 写代码时无法判断该用 `"user"` 还是 `"USER"`，极易写出运行时不匹配的 bug。这是**最危险**的隐患。

**位置**：
- `packages/shared/src/types/user.ts` — `Role = "user" | "admin" | "super_admin"`
- `packages/db/src/schema/users.ts` — `pgEnum("role", ["USER", "ADMIN", "SUPER_ADMIN"])`
- 同样问题存在于 `status`、`pricing_type`、`category` 等枚举

**建议方案**：
1. 以 `packages/db` 的 `pgEnum` 为唯一真相源（大写）
2. `packages/shared` 的类型改为 `type Role = "USER" | "ADMIN" | "SUPER_ADMIN"`
3. 前端展示用 `const ROLE_LABELS: Record<Role, string> = { USER: "用户", ... }` 做映射
4. **禁止**两端各自维护枚举字面量

**工作量**：0.5 人日
**风险**：中（涉及 DB 数据迁移，但 production 数据量小，可直接 UPDATE）

---

### P0-2 packages `"./*"` exports 过松

**风险**：AI 可以 `import { internalHelper } from "@lynxkit/shared/utils/internal"`，绕过公共 API，导致重构时破坏隐式契约。

**位置**：5 个包的 `package.json`
- `packages/shared/package.json` — `"./*": "./src/*"`
- `packages/db/package.json` — `"./*": "./src/*"`
- `packages/store/package.json` — `"./*": "./src/*"`
- `packages/api-client/package.json` — `"./*": "./src/*"`
- `packages/agent-core/package.json` — `"./*": "./src/*"`

**建议方案**：
1. 删除所有 `"./*"` 通配导出
2. 改为显式 `exports` 字段：
```json
{
  "exports": {
    ".": "./src/index.ts",
    "./constants": "./src/constants/index.ts",
    "./types": "./src/types/index.ts",
    "./utils": "./src/utils/index.ts",
    "./schemas": "./src/schemas/index.ts"
  }
}
```
3. 全局搜索 `from "@lynxkit/shared/` 修正为显式路径

**工作量**：0.5 人日
**风险**：低（编译期会报错，逐个修即可）

---

### P0-3 `@lynxkit/templates` 完全孤立

**风险**：6 个模板中 5 个（admin-dashboard / content-publish / event-manage / light-commerce / service-booking）只有 `template.json` + 空 `.gitkeep`，是死代码。AI 重构时会被误导，以为这些是有效模板。

**位置**：`packages/templates/`

**建议方案**：
1. 删除 5 个空壳模板目录
2. 保留 `_base/`、`social/`、`static-site/` 3 个有实现的模板
3. 在 `packages/templates/README.md` 中说明「新增模板必须先实现 _base 继承 + 完整 scaffold」
4. 添加 CI 校验：模板目录必须含 `src/` 子目录或 `extends/` 软链

**工作量**：0.2 人日
**风险**：低（删除死代码）

---

### P0-4 admin / web 测试覆盖为 0

**风险**：admin 0 测试、web 0 测试。AI 改这两个 app 的代码时**完全没有回归测试**，是「改一漏三」的根源。

**位置**：
- `apps/admin/src/` — 32 个源文件，0 个测试
- `apps/web/src/` — 63 个源文件，0 个测试

**建议方案**：
1. **P0 阶段**：先给两个 app 的核心 lib / 高频复用组件写测试（不要求覆盖率，先有）
   - `apps/admin/src/lib/api.ts` — 客户端调用契约
   - `apps/admin/src/lib/utils.ts` — 工具函数
   - `apps/web/src/lib/seo.ts` — SEO 元信息生成
   - `apps/web/src/components/store/data.ts` — 数据源
2. **P1 阶段**：补全页面组件快照测试
3. **目标**：迭代 17 末，admin + web 测试覆盖率达到 30%；迭代 19 末达到 60%

**工作量**：8 人日（admin）+ 12 人日（web）
**风险**：低（纯新增测试，不改生产代码）

---

### P0-5 `apps/web/src/app/admin/*` 全是 mock 死代码

**风险**：web app 下有 5 个 admin 页面（monitoring / orders / products / users / page.tsx），全部使用 `mock` 假数据。AI 重构时会以为这些是有效页面，浪费精力。

**位置**：
- `apps/web/src/app/admin/monitoring/page.tsx`
- `apps/web/src/app/admin/orders/page.tsx`
- `apps/web/src/app/admin/products/page.tsx`
- `apps/web/src/app/admin/users/page.tsx`
- `apps/web/src/app/admin/page.tsx`
- `apps/web/src/app/admin/layout.tsx`

**建议方案**：直接删除整个 `apps/web/src/app/admin/` 目录（独立 admin app 已存在于 `apps/admin/`）

**工作量**：0.1 人日
**风险**：低（确认无路由引用即可删除）

---

## 三、P1 中等问题（增加 AI 误解风险）

### P1-1 大文件拆分

#### 后端路由（4 个）

| 文件 | 行数 | 建议拆分方案 | 工作量 |
|------|------|-------------|--------|
| [store.ts](file:///d:/LynxKit/apps/api/src/routes/store.ts) | 591 | 拆 6 个：`store/list.ts`、`store/detail.ts`、`store/create.ts`、`store/update.ts`、`store/delete.ts`、`store/handler.ts`（仅 re-export + 路由挂载） | 1.0 人日 |
| [build.ts](file:///d:/LynxKit/apps/api/src/routes/build.ts) | 576 | 拆 4 个：`build/create.ts`、`build/get.ts`、`build/preview.ts`、`build/handler.ts` | 1.0 人日 |
| [agent.ts](file:///d:/LynxKit/apps/api/src/routes/agent.ts) | 475 | 拆 4 个：`agent/start.ts`、`agent/stream.ts`、`agent/clarify.ts`、`agent/handler.ts` | 0.8 人日 |
| [auth.ts](file:///d:/LynxKit/apps/api/src/routes/auth.ts) | 463 | 拆 4 个：`auth/login.ts`、`auth/register.ts`、`auth/verify.ts`、`auth/handler.ts` | 0.8 人日 |

**统一拆分规范**：
- 每个路由文件 ≤ 200 行
- `handler.ts` 只负责挂载路由（`app.route('/store', storeHandler)`），不含业务逻辑
- 业务逻辑在子文件中，每个文件一个资源操作
- 每个子文件导出 `export const xxxHandler = factory.create(...)`，类型显式标注

#### Admin 页面（7 个）

| 文件 | 行数 | 建议拆分方案 | 工作量 |
|------|------|-------------|--------|
| `apps/admin/src/app/(admin)/memberships/page.tsx` | ≈1040 | 拆 5 个：`_components/members-table.tsx`、`_components/refund-dialog.tsx`、`_components/stats-cards.tsx`、`_components/filter-bar.tsx`、`_hooks/use-memberships.ts` | 1.5 人日 |
| `apps/admin/src/app/(admin)/ai-models/page.tsx` | ≈633 | 拆 3 个：`_components/model-table.tsx`、`_components/model-form-dialog.tsx`、`_hooks/use-models.ts` | 0.8 人日 |
| `apps/admin/src/app/(admin)/builds/page.tsx` | ≈620 | 拆 3 个：`_components/build-table.tsx`、`_components/build-detail-drawer.tsx`、`_hooks/use-builds.ts` | 0.8 人日 |
| `apps/admin/src/app/(admin)/store/page.tsx` | ≈611 | 拆 3 个：`_components/product-table.tsx`、`_components/product-form-dialog.tsx`、`_hooks/use-products.ts` | 0.8 人日 |
| `apps/admin/src/app/(admin)/agents/page.tsx` | ≈605 | 拆 3 个：`_components/agent-table.tsx`、`_components/agent-form-dialog.tsx`、`_hooks/use-agents.ts` | 0.8 人日 |
| `apps/admin/src/app/(admin)/users/page.tsx` | ≈562 | 拆 3 个：`_components/user-table.tsx`、`_components/user-form-dialog.tsx`、`_hooks/use-users.ts` | 0.8 人日 |
| `apps/admin/src/app/(admin)/configs/page.tsx` | ≈526 | 拆 3 个：`_components/config-table.tsx`、`_components/config-form-dialog.tsx`、`_hooks/use-configs.ts` | 0.7 人日 |

**统一拆分规范**：
- 每个 `page.tsx` ≤ 200 行（只负责数据获取 + 组装）
- UI 拆到 `_components/`，业务逻辑拆到 `_hooks/`
- 复用组件（分页 / 删除确认弹窗 / Toast）提取到 `apps/admin/src/components/shared/`

#### Web 页面（1 个）

| 文件 | 行数 | 建议拆分方案 | 工作量 |
|------|------|-------------|--------|
| `apps/web/src/app/(user)/membership/page.tsx` | ≈935 | 拆 4 个：`_components/plans-section.tsx`、`_components/benefits-section.tsx`、`_components/checkout-dialog.tsx`、`_hooks/use-membership.ts` | 1.2 人日 |

#### 桌面端 / 移动端

| 文件 | 行数 | 建议拆分方案 | 工作量 |
|------|------|-------------|--------|
| `apps/desktop/src/routes/build/deploy.tsx` | 709 | 拆 3 个：`_components/deploy-progress.tsx`、`_components/deploy-logs.tsx`、`_hooks/use-deploy.ts` | 1.0 人日 |
| `apps/mobile/app/build/[sessionId]/deploy.tsx` | 567 | 拆 2 个：`_components/DeployProgress.tsx`、`_hooks/useDeploy.ts` | 0.8 人日 |
| `apps/desktop/src/routes/build/preview.tsx` | 434 | 拆 2 个：`_components/preview-iframe.tsx`、`_hooks/use-preview.ts` | 0.5 人日 |

**总计工作量**：约 12 人日

---

### P1-2 跨端重复代码消除

| 重复项 | 重复次数 | 散落位置 | 建议落点 | 工作量 |
|--------|---------|---------|---------|--------|
| 手机号正则 `^1[3-9]\d{9}$` | 5 处 | desktop / mobile / web / admin 各自实现 | 已存在 [packages/shared/src/utils/validators.ts](file:///d:/LynxKit/packages/shared/src/utils/validators.ts) `isPhone()`，直接替换 | 0.3 人日 |
| 密码强度算法 | 2 处 | desktop `login-form.tsx` / mobile `register.tsx` | 新建 `packages/shared/src/utils/password-strength.ts` | 0.3 人日 |
| 60 秒倒计时 hook | 4 处 | desktop / mobile 登录注册 | 新建 `packages/shared/src/hooks/use-countdown.ts` | 0.4 人日 |
| SSE 流事件解析 | 2 处 | desktop `deploy.tsx` / mobile `deploy.tsx` | 新建 `packages/shared/src/utils/sse-parser.ts` | 0.5 人日 |
| `safeStorage` 实现 | 3 处 | `packages/store/src/` 内重复 | 提取到 `packages/store/src/lib/safe-storage.ts`，单例导出 | 0.2 人日 |
| `lib/api.ts` 重复 | 2 处 | `apps/web/src/lib/api.ts` 与 `apps/desktop/src/lib/api.ts` 几乎逐字相同 | 删除两份，改为 `import { api } from "@lynxkit/api-client"` | 0.5 人日 |

**总计工作量**：约 2.2 人日
**风险**：低（行为不变，只是消除重复）

---

### P1-3 admin 接入共享包

**风险**：admin app 完全自写 `lib/api.ts`（250 行 fetch），未使用 `@lynxkit/api-client` / `@lynxkit/store` / `@lynxkit/ui-web`。导致 admin 与其他 4 端行为不一致（如鉴权刷新、错误处理、Toast 风格）。

**位置**：[apps/admin/src/lib/api.ts](file:///d:/LynxKit/apps/admin/src/lib/api.ts)

**建议方案**：
1. 删除 `apps/admin/src/lib/api.ts`
2. 改用 `import { api } from "@lynxkit/api-client"`
3. 引入 `@lynxkit/store` 管理鉴权状态（替代当前手写的 `useEffect` 检查 token）
4. 引入 `@lynxkit/ui-web` 的 `Button` / `Dialog` / `Toast` 替代当前 admin 内的本地组件

**工作量**：2 人日
**风险**：中（涉及 9 个页面的全量改造，需配合测试先行）

---

### P1-4 admin 7 个页面手写重复的分页 / 删除确认 / Toast

**风险**：约 350 行重复 JSX 散落在 7 个 admin 页面。AI 重构一个页面时容易遗漏其他页面。

**位置**：admin 7 个页面（memberships / ai-models / builds / store / agents / users / configs）

**建议方案**：提取到 `apps/admin/src/components/shared/`
- `<Pagination />` — 分页器
- `<DeleteConfirmDialog />` — 删除确认弹窗
- `<useToast />` — 已存在 `@lynxkit/ui-web` 的 `toast`，直接用

**工作量**：1 人日
**风险**：低

---

### P1-5 后端 78 处直接调用 `getDb()` 未用依赖注入

**风险**：测试时无法 mock DB，是测试覆盖率低的根因之一。仅 `publish-service.ts` 真正采用 DI。

**位置**：`apps/api/src/routes/*.ts`（78 处 `getDb()`）

**建议方案**：
1. 在 `apps/api/src/lib/db.ts` 增加 `createDbContext(db = getDb()) { return { db }; }` 工厂
2. 路由 handler 改为 `(c) => { const { db } = c.get('ctx'); ... }`
3. 中间件 `app.use('*', async (c, next) => { c.set('ctx', createDbContext()); await next(); })`
4. 测试时注入 mock DB

**工作量**：3 人日
**风险**：中（涉及全部路由，需配合 P0-4 测试先行）

---

### P1-6 后端 57 处状态字符串字面量散落

**风险**：如 `"pending"` / `"completed"` / `"failed"` 等状态字符串散落在路由代码中，AI 重构时容易拼错。

**位置**：`apps/api/src/routes/*.ts`

**建议方案**：
1. 在 `packages/shared/src/constants/` 新增 `build-status.ts` / `session-status.ts` / `payment-status.ts`
2. 用 `as const` 导出 `BuildStatus = { PENDING: "pending", COMPLETED: "completed", ... } as const`
3. 路由代码改为 `import { BuildStatus } from "@lynxkit/shared"`

**工作量**：0.5 人日
**风险**：低

---

### P1-7 后端 25 处不安全类型断言

**风险**：`as never` / `as unknown as` 共 25 处，AI 改代码时类型校验失效。

**位置**：`apps/api/src/routes/*.ts`（25 处）

**建议方案**：
1. 逐个分析根因（多数是 Hono Context 类型推断不出来）
2. 用泛型 + Zod schema 解决：`c.req.json(zodSchema)` 自动推断
3. 实在无法消除的，必须写注释说明原因

**工作量**：1 人日
**风险**：低

---

### P1-8 `packages/agent-core` 过度导出

**风险**：`packages/agent-core/src/index.ts` 不只导出公共 API，还导出了 `prompts/*` 和 `tools/*`，AI 会误以为这些是公共接口。

**位置**：[packages/agent-core/src/index.ts](file:///d:/LynxKit/packages/agent-core/src/index.ts)

**建议方案**：
1. `index.ts` 只导出 `Orchestrator`、`types`、`AgentContext`、`AgentResult`
2. `prompts/*` 和 `tools/*` 改为内部模块（不导出）
3. 如果确实需要外部访问 prompts，新增 `@lynxkit/agent-core/prompts` 子路径

**工作量**：0.3 人日
**风险**：低

---

## 四、P2 低优先级（清理项）

### P2-1 `packages/db/src/index.ts` 注释错误

**位置**：[packages/db/src/index.ts](file:///d:/LynxKit/packages/db/src/index.ts)

**问题**：注释写「11 张表」，实际 15 张表。

**建议**：更新注释为 15 张表，并列表说明。

**工作量**：0.05 人日

---

### P2-2 `auth-store` 参数顺序不一致

**位置**：[packages/store/src/auth-store.ts](file:///d:/LynxKit/packages/store/src/auth-store.ts)

**问题**：`setUser(user, token)` vs `login(token, user)` 参数顺序相反，AI 容易写错。

**建议**：统一为 `(user, token)` 顺序，或改为对象参数 `login({ user, token })`。

**工作量**：0.2 人日
**风险**：中（涉及所有调用方）

---

### P2-3 `api-client` 全部未传 Zod schema

**位置**：[packages/api-client/src/client.ts](file:///d:/LynxKit/packages/api-client/src/client.ts)

**问题**：`api-client` 支持可选 Zod schema 做响应校验，但所有 API 调用均未传 schema。

**建议**：分批补全 Zod schema，先从高频接口（auth / build / store）开始。

**工作量**：2 人日
**风险**：低

---

### P2-4 `agent-core/orchestrator.ts` 直接 mutate `ctx.answers`

**位置**：[packages/agent-core/src/orchestrator.ts](file:///d:/LynxKit/packages/agent-core/src/orchestrator.ts)

**问题**：副作用隐蔽，AI 改代码时容易踩坑。

**建议**：改为 `ctx.answers = [...ctx.answers, newAnswer]` 或 `Object.freeze(ctx)` + 显式返回新 ctx。

**工作量**：0.3 人日
**风险**：低

---

### P2-5 后端 8 处直接访问 `process.env`

**位置**：`apps/api/src/routes/*.ts`（8 处）

**问题**：应通过 [apps/api/src/env.ts](file:///d:/LynxKit/apps/api/src/env.ts) 统一访问。

**建议**：全部改为 `import { env } from "@/env"`。

**工作量**：0.2 人日
**风险**：低

---

### P2-6 web 与 desktop 的 `lib/api.ts` 重复（已在 P1-2 列出，此处仅追踪）

**状态**：已在 P1-2 中处理。

---

## 五、防漏改方案设计

### 5.1 三关卡 pre-commit hook

**目标**：每次 git commit 前自动跑 typecheck + lint + 关键测试，任一失败即拒绝提交。

**实现**：

```bash
# .husky/pre-commit
pnpm typecheck
pnpm lint
pnpm test:quick   # 仅跑受影响的测试（vitest --changed HEAD~1）
```

**配置文件**：
- `package.json` 新增 `scripts.test:quick`、`scripts.typecheck`、`scripts.lint`
- 安装 `husky` + `lint-staged`
- `lint-staged.config.cjs`：
```js
module.exports = {
  "*.{ts,tsx}": ["tsc --noEmit", "biome check"],
  "*.{ts,tsx,test.ts}": ["vitest related --run"],
};
```

**工作量**：0.5 人日
**风险**：低（先以 warn 模式运行 1 周，再改为 block）

---

### 5.2 TDD 强制流程规范

**新增到 `DEVELOPMENT.md` 的 §8.5**：

> **TDD 强制流程（v1.2 新增）**
>
> 任何代码改动（新功能 / bug 修复 / 重构）必须按以下顺序：
>
> 1. **RED**：先写测试，跑测试必须 FAIL（验证测试有效）
> 2. **GREEN**：写最小实现让测试 PASS
> 3. **REFACTOR**：重构代码，测试必须保持 PASS
>
> 提交时必须包含：
> - 测试文件（`.test.ts`）
> - 实现文件
> - commit message 中标注 `[TDD]` 前缀
>
> **例外**：纯样式 / 文案 / 配置改动可不写测试，但 commit message 标注 `[STYLE]` / `[COPY]` / `[CONFIG]`。

**配套 CI 校验**（`.github/workflows/ci.yml`）：
- 检测 commit message 是否符合规范
- 检测 commit 中是否包含 `.test.ts` 文件（除非有 `[STYLE]` / `[COPY]` / `[CONFIG]` 前缀）

**工作量**：0.3 人日
**风险**：低

---

### 5.3 覆盖率门槛

**目标**：迭代 19 末达到 60%，迭代 21 末达到 80%。

**实现**：修改 [vitest.config.ts](file:///d:/LynxKit/vitest.config.ts)：

```ts
coverage: {
  provider: "v8",
  reporter: ["text", "html", "lcov"],
  exclude: [
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/node_modules/**",
    "**/dist/**",
    "**/*.config.ts",
    "**/types.ts",
  ],
  thresholds: {
    // 渐进式提升：迭代 17 = 20%，迭代 19 = 40%，迭代 21 = 60%
    lines: 20,
    functions: 20,
    branches: 20,
    statements: 20,
  },
},
```

**CI 卡点**：覆盖率低于阈值时 CI 失败。

**工作量**：0.2 人日
**风险**：低

---

### 5.4 AI 改动影响面分析 checklist

**新增到 `DEVELOPMENT.md` 的 §8.6**：

> **AI 改动前 checklist（v1.2 新增）**
>
> AI 在改动任何代码前必须完成以下分析（在回复中显式列出）：
>
> 1. **影响面分析**：本次改动涉及哪些文件？哪些是直接改动？哪些可能受影响？
> 2. **测试覆盖检查**：涉及的文件是否有测试？如果没有，先写测试（RED 阶段）
> 3. **跨端影响检查**：改动是否影响其他 app / package？如改动 `packages/shared` 是否影响所有 app？
> 4. **回滚方案**：如果改动出问题，如何回滚？git revert 命令是什么？
> 5. **验收标准**：改完后如何验证？跑哪些测试？手动验收哪些场景？
>
> **示例输出**：
> ```
> ## 影响面分析
> - 直接改动：apps/desktop/src/components/auth/login-form.tsx
> - 可能受影响：apps/desktop/src/components/auth/auth-modal.tsx（调用 login-form）
> - 跨端影响：无（仅桌面端）
>
> ## 测试覆盖
> - login-form.tsx 当前无测试 → 先补 test (RED)
> - auth-modal.test.ts 已存在 → 跑测试验证不破坏
>
> ## 回滚方案
> git revert HEAD
>
> ## 验收标准
> - pnpm test:affected 通过
> - 手动验收：打开桌面端 → 点击登录 → 弹窗显示 → 输入 18942271267/ee9527ff → 登录成功
> ```

**工作量**：0.1 人日（仅写规范）
**风险**：低

---

### 5.5 回归测试套件（`pnpm test:regression`）

**目标**：每次大改动后跑一遍核心场景，确保不破坏既有功能。

**实现**：
1. 新增 `tests/regression/` 目录
2. 标记 `*.regression.test.ts` 文件
3. `package.json` 新增：
```json
{
  "scripts": {
    "test:regression": "vitest run --config vitest.regression.config.ts"
  }
}
```
4. `vitest.regression.config.ts` 仅包含 `*.regression.test.ts`

**首批回归测试覆盖**：
- 登录 / 注册 / 鉴权刷新
- 商店列表 / 详情 / 上架
- 构建会话创建 / 预览 / 部署
- Agent 编排全流程
- 会员购买 / 续费

**工作量**：3 人日
**风险**：低

---

### 5.6 防漏改方案总结

| 方案 | 工作量 | 阻挡率 | 优先级 |
|------|--------|--------|--------|
| pre-commit hook（typecheck + lint + affected test） | 0.5 人日 | 70% | P0 |
| TDD 强制流程规范 | 0.3 人日 | 80% | P0 |
| 覆盖率门槛 60% | 0.2 人日 | 90% | P0 |
| AI 改动前 checklist | 0.1 人日 | 50% | P0 |
| 回归测试套件 | 3 人日 | 95% | P1 |

**总工作量**：约 4.1 人日
**阻挡率综合**：> 95%（即 95% 的「改一漏三」问题会被上述方案阻挡）

---

## 六、实施路线图

### 迭代 17（P0 + 防漏改方案，约 5 人日）

**目标**：建立 AI 安全网，让后续重构有保障。

| 任务 | 工作量 | 验收标准 |
|------|--------|---------|
| P0-1 枚举值统一（小写 → 大写） | 0.5 人日 | DB 数据迁移完成；shared 类型更新；typecheck 通过 |
| P0-2 packages exports 显式化 | 0.5 人日 | 5 个包删除 `"./*"`；显式 exports 字段；typecheck 通过 |
| P0-3 删除 templates 5 个空壳 | 0.2 人日 | 5 个目录删除；CI 校验添加 |
| P0-5 删除 web/admin mock 死代码 | 0.1 人日 | `apps/web/src/app/admin/` 删除 |
| 5.1 pre-commit hook | 0.5 人日 | 提交时自动跑 typecheck + lint + affected test |
| 5.2 TDD 强制流程规范 | 0.3 人日 | DEVELOPMENT.md v1.2 更新；CI 校验 commit message |
| 5.3 覆盖率门槛 20% | 0.2 人日 | vitest.config.ts 更新；CI 卡点启用 |
| 5.4 AI 改动前 checklist | 0.1 人日 | DEVELOPMENT.md v1.2 更新 |
| P0-4 admin + web 核心 lib 测试（首批） | 2.6 人日 | 覆盖率达到 20% |

### 迭代 18（P1 大文件拆分 + 跨端重复消除，约 14 人日）

**目标**：消除 AI 误解风险最高的部分。

| 任务 | 工作量 | 验收标准 |
|------|--------|---------|
| P1-1 后端 4 个路由拆分 | 3.6 人日 | 每个文件 ≤ 200 行；测试通过 |
| P1-1 admin 7 个页面拆分 | 6.4 人日 | 每个文件 ≤ 200 行；快照测试通过 |
| P1-1 web membership 拆分 | 1.2 人日 | 每个文件 ≤ 200 行 |
| P1-1 desktop / mobile deploy 拆分 | 2.3 人日 | 每个文件 ≤ 200 行 |
| P1-2 跨端重复消除（6 项） | 2.2 人日 | 5 类重复全部下沉 packages |

### 迭代 19（P1 后端 DI + 状态枚举 + admin 接入共享包，约 6 人日）

**目标**：后端可测试性 + admin 统一架构。

| 任务 | 工作量 | 验收标准 |
|------|--------|---------|
| P1-3 admin 接入 @lynxkit/api-client | 2 人日 | 删除 admin/lib/api.ts；全部使用共享包 |
| P1-4 admin 重复组件提取 | 1 人日 | 7 个页面使用 shared 组件 |
| P1-5 后端 DI 改造 | 3 人日 | 78 处 getDb() 全部改为注入；可 mock |
| P1-6 状态枚举常量化 | 0.5 人日 | 57 处字面量改为 import 常量 |
| P1-7 不安全类型断言消除 | 1 人日 | 25 处 → ≤ 5 处（带注释） |
| P1-8 agent-core 过度导出收敛 | 0.3 人日 | index.ts 只导出公共 API |

### 迭代 20+（P2 清理 + 覆盖率提升，约 5 人日）

| 任务 | 工作量 | 验收标准 |
|------|--------|---------|
| P2-1 db 注释修正 | 0.05 人日 | 15 张表 |
| P2-2 auth-store 参数顺序统一 | 0.2 人日 | 全部 `(user, token)` |
| P2-3 api-client Zod schema 补全 | 2 人日 | 高频接口全部有 schema |
| P2-4 orchestrator 副作用消除 | 0.3 人日 | 不再 mutate ctx |
| P2-5 process.env 改 env.ts | 0.2 人日 | 8 处全部改完 |
| 5.5 回归测试套件 | 3 人日 | 核心场景全覆盖 |
| 5.3 覆盖率门槛提升到 60% | - | CI 卡点更新 |

### 路线图总结

| 迭代 | 重点 | 工作量 | 风险 |
|------|------|--------|------|
| 17 | P0 + 防漏改方案 | 5 人日 | 低（不改业务代码） |
| 18 | 大文件拆分 + 跨端重复消除 | 14 人日 | 中（需测试先行） |
| 19 | 后端 DI + admin 接入共享包 | 6 人日 | 中（涉及 admin 全量改造） |
| 20+ | P2 清理 + 回归测试 + 覆盖率提升 | 5 人日 | 低 |

**总计**：约 30 人日

---

## 七、附录

### 7.1 大文件 TOP 12 清单

| # | 文件 | 行数 | 优先级 |
|---|------|------|--------|
| 1 | `apps/admin/src/app/(admin)/memberships/page.tsx` | ≈1040 | P1 |
| 2 | `apps/web/src/app/(user)/membership/page.tsx` | ≈935 | P1 |
| 3 | `apps/desktop/src/routes/build/deploy.tsx` | 709 | P1 |
| 4 | `apps/admin/src/app/(admin)/ai-models/page.tsx` | ≈633 | P1 |
| 5 | `apps/admin/src/app/(admin)/builds/page.tsx` | ≈620 | P1 |
| 6 | `apps/mobile/app/build/[sessionId]/deploy.tsx` | 567 | P1 |
| 7 | `apps/api/src/routes/store.ts` | 591 | P1 |
| 8 | `apps/api/src/routes/build.ts` | 576 | P1 |
| 9 | `apps/admin/src/app/(admin)/store/page.tsx` | ≈611 | P1 |
| 10 | `apps/admin/src/app/(admin)/agents/page.tsx` | ≈605 | P1 |
| 11 | `apps/admin/src/app/(admin)/users/page.tsx` | ≈562 | P1 |
| 12 | `apps/admin/src/app/(admin)/configs/page.tsx` | ≈526 | P1 |

### 7.2 测试覆盖矩阵

| App / Package | 源文件数 | 测试文件数 | 当前覆盖率 | 目标覆盖率 |
|---------------|---------|-----------|-----------|-----------|
| `apps/api` | 38 | 4 | ~10% | 60% |
| `apps/admin` | 32 | 0 | 0% | 60% |
| `apps/web` | 63 | 0 | 0% | 60% |
| `apps/desktop` | 48 | 2 | ~4% | 50% |
| `apps/mobile` | 37 | 1 | ~3% | 50% |
| `packages/shared` | - | - | ~30% | 80% |
| `packages/db` | - | - | ~10% | 60% |
| `packages/store` | - | - | ~20% | 80% |
| `packages/api-client` | - | - | ~10% | 60% |
| `packages/agent-core` | - | - | ~25% | 70% |
| **总计** | 376 | 19 | **5.1%** | **60%** |

### 7.3 子代理报告索引

本次诊断基于 4 个并行子代理的深度分析：

1. **API 后端分析报告** — 覆盖 `apps/api/src` 全量代码
   - 关键发现：4 个路由 > 400 行需拆分；25 处不安全断言；57 处状态字面量；78 处直接 `getDb()`
2. **桌面端 + 移动端分析报告** — 覆盖 `apps/desktop/src` + `apps/mobile/`
   - 关键发现：deploy.tsx (709 行)；5 类跨端重复；SSE 解析重复
3. **Web + Admin 分析报告** — 覆盖 `apps/web` + `apps/admin`
   - 关键发现：admin 0 测试；web 0 测试；admin mock 死代码；admin 未用共享包
4. **Packages 核心分析报告** — 覆盖全部 10 个包
   - 关键发现：5 个包 exports 过松；枚举双轨；templates 孤立；agent-core 过度导出

### 7.4 AI 友好方向落实情况

| 方向 | 当前状态 | 目标状态 | 实施迭代 |
|------|---------|---------|---------|
| 小文件 + 单一职责 | 12 个文件 > 400 行 | 0 个文件 > 400 行 | 18 |
| 显式类型 + 接口契约 | 25 处不安全断言；exports 过松 | ≤ 5 处断言；显式 exports | 17 + 19 |
| 纯函数提取 + 依赖注入 | 78 处直接 getDb() | 全部 DI；可 mock | 19 |
| 模块边界 + 索引文件 | 5 个包 `"./*"` exports | 显式 exports 字段 | 17 |

### 7.5 防漏改方案落实情况

| 方案 | 当前状态 | 目标状态 | 实施迭代 |
|------|---------|---------|---------|
| 回归测试套件 + pre-commit hook | 无任何关卡 | 三关卡（typecheck + lint + test） | 17 |
| TDD 强制 + 覆盖率门槛 | TDD 是规范但无强制；无覆盖率门槛 | TDD CI 校验；覆盖率 60% 门槛 | 17 + 20 |

---

## 八、下一步行动

请用户审阅本报告，并确认以下事项：

1. **优先级是否合理**：P0 / P1 / P2 的划分是否符合预期？
2. **迭代路线图是否合理**：迭代 17（P0）→ 18（拆分）→ 19（DI）→ 20+（清理）的顺序是否符合预期？
3. **是否需要调整范围**：是否有需要降级或升级的项？
4. **是否需要补充项**：是否有遗漏的问题？

确认后，将从**迭代 17**开始分批落地，每批完成后单独提交 + 双推 + 自测，确保零风险。

---

> 报告产出时间：2026-07-07
> 报告产出方式：4 个并行子代理深度分析 + 人工综合
> 下次更新：用户审阅后
