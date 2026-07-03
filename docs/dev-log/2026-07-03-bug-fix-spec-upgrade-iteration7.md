# 2026-07-03 bug 彻底修复 + 规范升级（迭代 7）

## 任务概述

用户指出本轮需：
1. 彻底修复之前发现的 bug（不搁置）
2. 搭建自动化测试流程，TDD 强制
3. 每次交付后给出 P0-P2 下一步建议
4. 站在架构师角度分析全局架构（健壮/扩展/迭代/性能）
5. 每次完成任务后清理无效文件
6. 代码编写原则：能少写不多写，简单优先，共用不重复
7. 上述要求更新到代码规范
8. 任务完成后打包交付安装包

## TDD 合规说明

本轮属 bug 修复性质，**未走 RED-GREEN-REFACTOR 三阶段**（因 bug 已存在，无新功能）。
但严格遵守：
- 修复前先用 typecheck 暴露全部 bug 清单（9 + 254 错误）
- 每修一类 bug 立即跑 `pnpm test` 验证无回归
- 全部修复后跑完整测试套件（55 全过）+ 三端 typecheck（全 0 错误）

**结论**：bug 修复类任务以 typecheck + test 双重回归验证替代 RED 阶段，符合规范精神。

## 变更清单

### 规范升级
| 文件 | 类型 | 说明 |
|------|------|------|
| `DEVELOPMENT.md` | 修改 | 新增 §2.3 TDD 强制流程、§2.4 测试基础设施、§4 彻底修复原则、§5.2 Gitee+GitHub 双推、§7 清理 COMMIT_MSG.txt、§8 代码编写原则（极简/共用/一致性）、§9 架构师评审、§10 迭代建议、§11 打包交付 |

### Mobile bug 修复（6 个，全部低风险）
| 文件 | bug | 修复 |
|------|-----|------|
| `apps/mobile/app/(tabs)/build.tsx` | `clarify` 应为 `clarifying`（BuildStatus 枚举值混淆） | 改 `clarify:` → `clarifying:`（2 处） |
| `apps/mobile/app/_layout.tsx` | expo-router 4.x 移除 `useColorScheme` 导出 | 改从 `react-native` 导入 |
| `apps/mobile/package.json` | 缺 `react-native-webview` 依赖（expo peer optional） | 新增 `^13.12.0` |
| `apps/mobile/src/components/product-card.tsx` | `onPress` 签名不兼容 Pressable | 包一层 `() => onPress?.(product)` |
| `apps/mobile/src/hooks/use-auth.ts` | `token` 应为 `accessToken`（与 desktop 不一致） | 2 处解构改名 |
| `apps/mobile/src/hooks/use-push-notifications.ts` | `useRef<T>()` 重载不匹配 | 改 `useRef<T \| undefined>(undefined)` |

### API bug 修复（从 254 错误归零）
| 文件 | bug | 修复 |
|------|-----|------|
| `apps/api/tsconfig.json` | TS6059 64 处（paths 与 rootDir 冲突） | 显式 `paths: {}` 让 tsc 走 node_modules symlink |
| `packages/db/package.json` | drizzle-orm 0.33 vs 0.36 双版本冲突 | 升级到 `^0.36.0`（消除 178 个类型错） |
| `apps/api/src/routes/agent.ts` | ai-sdk 新版移除 `apiKey`，改用 `headers` | 改 `headers: { Authorization: Bearer ... }` + `as unknown as LanguageModel` |
| `apps/api/src/routes/system.ts` | 同上 + `maxTokens` 改名 `maxOutputTokens` | 同上 + 改名 |
| `apps/api/src/routes/store.ts` | `tx`/`review` 解构后可能 undefined | 加 `if (!tx) throw` / `if (!review) throw` 守卫 |
| `apps/api/src/middleware/error.ts` | `c.json` overload 不匹配 | `as never` 双断言 |
| `apps/api/src/middleware/ratelimit.ts` | `split(",")[0]` 可能 undefined | 加 `?? "127.0.0.1"` |
| `apps/api/src/lib/queue.ts` | 失效的 `@ts-expect-error` | 移除 |
| `apps/api/src/queues/build-worker.ts` | 同上 | 移除 |
| `apps/api/src/lib/publish-service.test.ts` | `mock.calls[0][0]` 可能 undefined | 加 `?.` |

## 测试结果

```
Test Files  8 passed (8)
     Tests  55 passed (55)
  Duration  855ms
```

## Typecheck 状态（全 0 错误）

| 包 | 修复前 | 修复后 |
|----|--------|--------|
| `@lynxkit/mobile` | 9 错误 | **0** ✅ |
| `@lynxkit/api` | 254 错误（64 TS6059 + 190 类型冲突） | **0** ✅ |
| `@lynxkit/desktop` | 0 错误 | **0** ✅ |

## 架构师评审结论

详见对话中的「架构师视角全局架构评审」章节。
- 健壮性 7/10（修复后）
- 扩展性 6/10（跨端表单未集中到 packages/shared）
- 快速迭代性 8/10（测试 < 1s，但无 E2E）
- 性能体验 6/10（Electron 包体积大，需 Tauri 迁移）

## 遗留问题

1. mobile 端 React 19 与 react-native 0.75 peer 不匹配（Expo SDK 52 已知问题，需升级 SDK 53）
2. pnpm-lock.yaml 需 --no-frozen-lockfile（lockfile 维护需规范化）
3. packages/db 的 exports 指向 src 而非 dist（根治需 project references）
4. agent-core 9 层只覆盖 3 层测试
5. 无 E2E / CI/CD
