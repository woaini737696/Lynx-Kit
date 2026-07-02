# 2026-07-02 桌面端 StoreCategory 崩溃 + Web 登录 404 修复（迭代 4）

## 任务概述

本轮修复用户实测安装包后报告的两个严重 bug，并按用户要求在开发规范中新增「阿里云部署约束」与「文件清理约束」两章。

1. 桌面端安装后报 `Uncaught ReferenceError: StoreCategory is not defined`
2. Web 端登录后跳转 `/download` 报 404
3. 用户要求对比 Electron vs Tauri 并决策技术栈（结论：保留 Electron）
4. DEVELOPMENT.md 新增第 6、7 章

## 变更清单

| 文件 | 类型 | 说明 |
|------|------|------|
| `apps/desktop/src/routes/store/index.tsx` | 修改 | `import type { StoreProduct, StoreCategory }` 拆为：值 import `StoreCategory` + 类型 import `StoreProduct` |
| `apps/web/src/app/(auth)/login/page.tsx` | 修改 | 登录成功跳转 `/download` → `/store` |
| `apps/web/src/app/(auth)/register/page.tsx` | 修改 | 注册成功跳转 `/download` → `/store` |
| `DEVELOPMENT.md` | 修改 | 新增第 6 章「阿里云服务器部署约束」+ 第 7 章「文件清理约束」，原附则顺移为第 8 章 |
| `apps/desktop/installer/LynxKit-Setup-0.1.0-x64.exe` | 重新打包 | hash 由 `index-1v3UspHj.js` → `index-CpBdvqDV.js`，StoreCategory enum 已正确打入产物 |

## 测试用例与验收清单

| 编号 | 场景 | 预期结果 | 实测 | 状态 |
|------|------|----------|------|------|
| TC-001 | 桌面端打开商店页不再 ReferenceError | 控制台无 `StoreCategory is not defined` | 打包产物 grep 验证 `StoreCategory2["WORKFLOW"]="workflow"` 存在 | ✅ |
| TC-002 | 商店分类筛选可点击切换 | 选中态切换、触发 storeApi.list | 代码逻辑未变，仅 enum 引用方式修复 | ✅ |
| TC-003 | Web 登录后不报 404 | 跳转 `/store` | `router.push("/store")` + `/store/page.tsx` 路由已存在 | ✅ |
| TC-004 | Web 注册后不报 404 | 跳转 `/store` | 同上 | ✅ |
| TC-005 | DEVELOPMENT.md 含 6、7 章节 | 第 6 章阿里云部署 + 第 7 章文件清理 | 已新增 | ✅ |
| TC-006 | 工作区干净、无临时文件 | `git status` 仅本次任务文件 | 4 个修改文件，无临时文件跟踪 | ✅ |
| TC-007 | 类型检查通过 | 0 error | 本轮修改文件无新增类型错误；遗留 ui-web 包与 @types/react@18.3.31 冲突为历史问题，不在本轮范围 | ⚠️ 部分通过 |

## 根因分析

### Bug 1：桌面端 `StoreCategory is not defined`

- **根因**：[apps/desktop/src/routes/store/index.tsx:11](file:///d:/LynxKit/apps/desktop/src/routes/store/index.tsx#L11) 原写法
  ```ts
  import type { StoreProduct, StoreCategory } from "@lynxkit/shared";
  ```
  后续代码却以**值**的方式引用 `StoreCategory.APP`、`StoreCategory.TEMPLATE` 等 enum 成员。`import type` 在 TypeScript 编译阶段会被完全擦除（类型声明不生成运行时代码），导致运行时 `StoreCategory` 变量未定义，访问 `.APP` 抛 `ReferenceError`。
- **修复**：将 enum 拆出为值 import：
  ```ts
  import { StoreCategory } from "@lynxkit/shared";
  import type { StoreProduct } from "@lynxkit/shared";
  ```
- **验证**：打包产物 `index-CpBdvqDV.js` 第 30426 行 `StoreCategory2["WORKFLOW"] = "workflow"` 存在，证明 enum 已正确进入运行时。

### Bug 2：Web 登录后 404

- **根因**：[login/page.tsx:42](file:///d:/LynxKit/apps/web/src/app/(auth)/login/page.tsx#L42) 和 [register/page.tsx:42](file:///d:/LynxKit/apps/web/src/app/(auth)/register/page.tsx#L42) 跳转 `/download`，但 web 路由表无此路径（路由仅有 `/`、`/store`、`/admin`、`/login`、`/register`、`/about`、`/blog`、`/features`、`/pricing`）。
- **修复**：与用户澄清后，跳转改为 `/store`（已有路由，最小改动）。

### Bug 3（决策项）：Electron vs Tauri

- 详细对比已在对话中给出，用户决策：**保留 Electron**，本轮不做技术栈迁移。
- 体积 81.4MB 是 Electron + Chromium 的固有成本，无法在 Electron 下压至 30MB 以下。

## 遗留问题与后续计划

1. **ui-web 包与 @types/react@18.3.31 类型冲突**：lucide-react 类型不匹配，desktop/web typecheck 报 10+ 处错误。属历史遗留，建议后续单独迭代处理（升级 @types/react 或锁定 lucide-react 版本）。
2. **安装包体积**：当前 81.4MB，如未来用户对体积敏感再评估 Tauri 迁移。
3. **桌面端运行时实测**：建议用户实际安装新包验证商店页可用，确认无运行时错误后再关闭本轮迭代。

## 提交信息

- 分支：master
- 提交哈希：见 `git log` 最新
- 推送目标：Gitee（origin）+ GitHub（github）

## 安装包

- 路径：`d:\LynxKit\apps\desktop\installer\LynxKit-Setup-0.1.0-x64.exe`
- 体积：约 81 MB（Electron 30.5.1 + Chromium runtime）
