# 迭代 16 · 桌面端认证改造为全屏液态玻璃弹窗

**日期**：2026-07-05
**范围**：`apps/desktop`（桌面端 UI）+ 服务器 DB（测试账号密码）
**提交哈希**：（待提交）

---

## 1. 任务概述

将桌面端登录/注册从「独立路由页」改造为「全屏液态玻璃弹窗」，并修正左下角登录按钮的黑白灰配色，同步更新测试账号密码。

### 用户原始诉求

1. 桌面端登录注册改为全屏弹窗，背景毛玻璃，弹窗液态玻璃
2. 测试账号密码改为 `18942271267/ee9527ff`
3. 左下角登录按钮改成黑白灰配色，遵从设计规范

---

## 2. 变更清单

### 新增

| 文件 | 用途 |
| --- | --- |
| `apps/desktop/src/store/auth-modal.ts` | 弹窗 UI 状态（open / view / intendedPath） |
| `apps/desktop/src/store/auth-modal.test.ts` | 7 用例 zustand store 单元测试 |
| `apps/desktop/src/components/auth/auth-modal.tsx` | 全屏液态玻璃弹窗容器（Radix Dialog 原语） |
| `apps/desktop/src/components/auth/login-form.tsx` | 登录表单（双 Tab：密码 / 验证码） |
| `apps/desktop/src/components/auth/register-form.tsx` | 注册表单（手机号 + 验证码 + 密码 + 昵称） |
| `apps/desktop/src/components/auth/form-fields.tsx` | 共享字段组件（Field / IconInput / PhoneInput） |

### 修改

| 文件 | 改动 |
| --- | --- |
| `apps/desktop/src/App.tsx` | 移除 `/login` `/register` 路由页；改为 `<Navigate to="/" replace />` 兼容旧深链；在 `<HashRouter>` 内挂载 `<AuthModal />` |
| `apps/desktop/src/components/auth/protected-route.tsx` | 未登录不再 `<Navigate>`，改为 `useEffect` 调 `openAuthModal('login', location.pathname)`，渲染 `null` |
| `apps/desktop/src/components/layout/sidebar.tsx` | 左下角登录按钮改用原生 `<button class="btn-ink">`（替代 shadcn `<Button>` 默认变体），点击调 `openAuthModal('login')` |
| `apps/desktop/src/globals.css` | 新增 `.glass-overlay`（毛玻璃遮罩 blur 40px）与 `.glass-card-strong`（液态玻璃 blur 50px + saturate 200%） |
| `.gitignore` | `release/` → `release/` + `release-*/`（适配临时绕开锁定的输出目录） |

### 删除

| 文件 | 删除原因 |
| --- | --- |
| `apps/desktop/src/routes/auth/login.tsx` | 表单逻辑迁移到 `components/auth/login-form.tsx` |
| `apps/desktop/src/routes/auth/register.tsx` | 表单逻辑迁移到 `components/auth/register-form.tsx` |

### 服务器侧变更

- DB：`UPDATE users SET password_hash = '<bcrypt $2a$10$...>' WHERE phone = '18942271267'`
- 验证：`curl POST /api/v1/auth/login` 返回有效 JWT

---

## 3. 设计与实现要点

### 3.1 全屏弹窗 vs 路由页

**问题**：原 `/login` `/register` 是 `fixed inset-0 z-50` 的全屏路由页，路由跳转后丢失原页上下文，且登录↔注册需在两个 URL 间跳转。

**方案**：改为全局 `<AuthModal />` 组件，挂载在 `<HashRouter>` 内（可访问 `useNavigate`）。
- `useAuthModal` zustand store 持有 `{ open, view, intendedPath }`
- `ProtectedRoute` 未登录时 `useEffect` 调 `openAuthModal('login', location.pathname)`，原路径写进 `intendedPath`
- 登录成功后 `AuthModal.handleSuccess` 读取 `intendedPath` 并 `navigate(target, { replace: true })`

### 3.2 液态玻璃视觉

- **遮罩** `.glass-overlay`：`background: rgba(15,15,18,0.32)` + `backdrop-filter: blur(40px) saturate(140%)`
- **容器** `.glass-card-strong`：`background: var(--glass-bg-strong)` + `backdrop-filter: blur(50px) saturate(200%)` + `box-shadow: 0 24px 64px rgba(15,23,42,0.18)` + 内嵌高光
- 暗色模式独立覆盖

### 3.3 Radix 原语直接控制

`@lynxkit/ui-web` 的 `DialogContent` 默认渲染自带 X 关闭按钮，会与自定义按钮重叠。改用 `@radix-ui/react-dialog` 原语直接组装，避免默认按钮。

### 3.4 共用原则（DEVELOPMENT.md §8.2）

`login.tsx` 与 `register.tsx` 原本各自重复实现了 `Field` / `IconInput` / `PhoneInput`。提取到 `form-fields.tsx` 共用。

### 3.5 左下角登录按钮黑白灰问题

**根因**：原代码使用 shadcn `<Button>` 默认变体，其 `bg-primary`（品牌橙 `#FF6B35`）作为 Tailwind utility 位于 `@layer utilities`，**优先级高于** `.btn-ink { background: var(--ink-950) }`（`@layer components`）。导致 `.btn-ink` 被覆盖，按钮显示为橙色而非黑色。

**修复**：改用原生 `<button className="btn-ink ...">`，不引入 shadcn `<Button>` 的 `bg-primary` utility，确保 `.btn-ink` 的纯黑底白字生效。

---

## 4. 测试用例与验收清单

### 4.1 单元测试（TDD）

| 用例编号 | 场景 | 优先级 | 自测结果 |
| --- | --- | --- | --- |
| TC-AM-01 | 初始状态：关闭 + login + 无 intendedPath | P0 | ✅ |
| TC-AM-02 | `openAuthModal('login')` 打开弹窗 | P0 | ✅ |
| TC-AM-03 | `openAuthModal('register')` 切换视图 | P0 | ✅ |
| TC-AM-04 | 携带 intendedPath 时存储 | P0 | ✅ |
| TC-AM-05 | 不传 intendedPath 时清空原值 | P0 | ✅ |
| TC-AM-06 | setView 切换 login ↔ register | P0 | ✅ |
| TC-AM-07 | closeAuthModal 关闭 + 清空 intendedPath + 保留 view | P0 | ✅ |

**全量测试**：`pnpm exec vitest run` → 19 文件 / 128 用例 全部 ✅

### 4.2 类型检查

`pnpm --filter @lynxkit/desktop typecheck` → ✅ 无错误

### 4.3 桌面端构建

`pnpm --filter @lynxkit/desktop build` → ✅ 成功
- 产物路径：`apps/desktop/release-v2/LynxKit-Setup-0.1.0-x64.exe`（81.72 MB）
- 注：原 `release/win-unpacked/resources/app.asar` 被系统进程锁定（疑似 Defender 扫描），临时改用 `--config.directories.output=release-v2` 绕开。installer 已存在，待旧锁释放后可清理。

### 4.4 服务器侧验收

- DB UPDATE 成功：`UPDATE 1`，验证 `password_hash` 字段已更新
- API 登录验证：`POST /api/v1/auth/login` 返回 200 + 有效 JWT (access + refresh)
- 测试账号：`18942271267 / ee9527ff`

### 4.5 TDD 合规说明

- **RED**：先写 `auth-modal.test.ts`，运行确认因 `./auth-modal` 模块缺失而 7/7 失败
- **GREEN**：实现 `auth-modal.ts`，7/7 通过
- **REFACTOR**：将 `Field` / `IconInput` / `PhoneInput` 抽到 `form-fields.tsx` 共用，测试仍全过

---

## 5. 架构师评审

### 5.1 健壮性
- ✅ 无 `any` 滥用，store 类型完整
- ✅ intendedPath 流转清晰：写入（ProtectedRoute）→ 读取（AuthModal.handleSuccess）→ 清空（closeAuthModal）
- ⚠️ 测试账号密码 `ee9527ff` 不满足注册密码复杂度（无大写字母），但通过 DB 直写绕过注册校验是预期行为，登录仅比对 bcrypt 哈希不受影响

### 5.2 扩展性
- ✅ AuthModal 是全局组件，可在任意位置通过 `openAuthModal()` 触发（不限于 sidebar / protected-route）
- ✅ view 字段可扩展为 `'login' | 'register' | 'forgot-password'` 等

### 5.3 快速迭代性
- ✅ 单元测试 < 5ms
- ✅ typecheck 秒级
- ⚠️ 桌面端构建 5s + electron-builder 打包 ~30s（可接受）

### 5.4 性能体验
- ✅ 桌面安装包 81.72 MB（与上版持平）
- ✅ 弹窗打开/关闭动画 200ms，毛玻璃遮罩 blur 40px 性能开销可接受

---

## 6. 遗留问题与后续计划

### P0（阻塞性）
- 无

### P1（工程质量）
- 旧的 `release/win-unpacked` 目录被系统锁定未清理，下次重启后清理并合并 `release-v2/` → `release/`
- 桌面端 E2E 测试缺失（本次仅单元测试 + 类型检查），后续迭代可补 Playwright 桌面端测试

### P2（体验优化）
- AuthModal 当前无切换登录↔注册时的过渡动画（仅条件渲染），可加 `data-[state]` 动画
- `intendedPath` 持久化在 store 内存中，刷新页面会丢失（桌面端 HashRouter 一般不刷新，影响小）

---

## 7. 下一步建议

按 P0-P2 优先级：

- **P0**：交付当前桌面端安装包供用户体验新的全屏弹窗登录
- **P1**：补桌面端 Playwright E2E（覆盖：未登录访问 /build → 弹窗打开 → 输入密码 → 跳回 /build）
- **P2**：弹窗内 Tab 切换动画 + 密码可见性切换按钮（用户体验细节）
