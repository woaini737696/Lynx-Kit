# 妙想 · Web 设计规范 (DESIGN_SYSTEM.md)

> **强制规范**：所有 Web 端新页面与重构必须严格遵守本规范。
> 设计语言：**极简黑白灰 + iOS 26 Liquid Glass 毛玻璃质感**
> 适用范围：`apps/web`、`apps/desktop`（共享 UI 库 `packages/ui-web`）

---

## 1. 设计原则

| 原则 | 说明 |
|---|---|
| 极简 | 8 级灰阶为主，禁止彩色装饰；强调内容本身 |
| 玻璃质感 | 所有表层元素采用 Liquid Glass（半透明 + 高斯模糊 + 内嵌高光） |
| 黑白对比 | 纯黑 `#09090B` 作为唯一视觉焦点（按钮、强调元素） |
| 大圆角 | 卡片 20px、按钮胶囊、容器 24px+ |
| 留白 | 充足留白比拥挤更高级；section 间距 80-128px |

---

## 2. 色板 · 8 级灰阶

| Token | Hex | 用途 |
|---|---|---|
| `--ink-0` | `#FFFFFF` | 纯白底 |
| `--ink-50` | `#FAFAFA` | 最浅背景 |
| `--ink-100` | `#F5F5F7` | 默认背景 |
| `--ink-200` | `#EBEBEF` | 卡片背景 |
| `--ink-300` | `#D8D8DE` | 边框 |
| `--ink-400` | `#A1A1AA` | 占位符/次要文本 |
| `--ink-500` | `#71717A` | 正文次要 |
| `--ink-600` | `#52525B` | 正文 |
| `--ink-700` | `#3F3F46` | 标题次要 |
| `--ink-800` | `#27272A` | 标题 |
| `--ink-900` | `#18181B` | 主标题 |
| `--ink-950` | `#09090B` | 纯黑强调（按钮/链接） |

### 毛玻璃 Token

| Token | 值 | 用途 |
|---|---|---|
| `--glass-bg` | `rgba(255,255,255,0.55)` | 默认玻璃背景 |
| `--glass-bg-strong` | `rgba(255,255,255,0.72)` | 强玻璃（弹窗卡） |
| `--glass-bg-subtle` | `rgba(255,255,255,0.35)` | 轻玻璃（hover/嵌套） |
| `--glass-border` | `rgba(255,255,255,0.7)` | 玻璃边框 |
| `--glass-border-subtle` | `rgba(255,255,255,0.35)` | 轻边框 |
| `--glass-blur` | `30px` | 默认模糊半径 |
| `--glass-shadow` | `0 8px 32px rgba(15,23,42,0.08), 0 1px 0 rgba(255,255,255,0.6) inset, 0 -1px 0 rgba(15,23,42,0.03) inset` | 玻璃阴影 |

### 暗色模式 Token 覆盖

```css
:root[data-widget-theme="dark"], .dark {
  --glass-bg: rgba(30, 30, 35, 0.55);
  --glass-bg-strong: rgba(40, 40, 48, 0.72);
  --glass-bg-subtle: rgba(30, 30, 35, 0.35);
  --glass-border: rgba(255, 255, 255, 0.12);
  --glass-border-subtle: rgba(255, 255, 255, 0.06);
  --glass-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.08) inset, 0 -1px 0 rgba(0,0,0,0.2) inset;
}
```

---

## 3. 排版

### 字体栈
```css
--font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
--font-metric: "SF Mono", "JetBrains Mono", monospace;
```

### 字阶

| Token | 字号/行高 | 字重 | 字距 | 用途 |
|---|---|---|---|---|
| `--text-hero` | 56/64 | Bold (700) | -0.04em | 首页主标题 |
| `--text-display` | 40/48 | Bold (700) | -0.03em | 二级页面大标题 |
| `--text-section` | 24/32 | Semibold (600) | -0.02em | 区块标题 |
| `--text-title` | 18/26 | Semibold (600) | 0 | 卡片标题 |
| `--text-body-lg` | 16/26 | Regular (400) | 0 | 正文大 |
| `--text-body` | 14/22 | Regular (400) | 0 | 正文 |
| `--text-caption` | 12/18 | Regular/Medium | 0 | 辅助说明 |
| `--text-code` | 13/20 | Regular (400) | 0 | 数据/代码 |

---

## 4. 间距与圆角

### 间距
```
--spacer-4: 4px   --spacer-8: 8px   --spacer-12: 12px
--spacer-16: 16px  --spacer-20: 20px  --spacer-24: 24px
--spacer-32: 32px  --spacer-40: 40px  --spacer-64: 64px
```

### 圆角
```
--radius-sm: 8px       /* 输入框 */
--radius: 12px         /* 按钮 */
--radius-md: 16px      /* 小卡 */
--radius-card: 20px    /* 默认卡片 */
--radius-lg: 24px      /* 大容器 */
--radius-xl: 28px      /* 模态 */
--radius-full: 9999px  /* 胶囊/圆形 */
```

---

## 5. 组件规范

### 5.1 Button

```css
.btn-primary {
  background: var(--ink-950);
  color: var(--ink-0);
  border-radius: var(--radius-full);
  padding: 9px 18px;
  font-weight: 500;
  box-shadow: 0 4px 14px rgba(0,0,0,0.18);
}
.btn-primary:hover { background: var(--ink-800); transform: translateY(-1px); }

.btn-glass {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(20px) saturate(180%);
  color: var(--ink-800);
}

.btn-ghost {
  background: transparent;
  color: var(--ink-600);
}
```

### 5.2 Card (Liquid Glass)

```css
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  box-shadow: var(--glass-shadow);
}
```

### 5.3 Input

```css
.input-glass {
  padding: 10px 14px;
  border-radius: var(--radius);
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  backdrop-filter: blur(20px) saturate(180%);
}
.input-glass:focus {
  outline: none;
  border-color: var(--ink-400);
  background: var(--glass-bg-strong);
}
```

### 5.4 Badge

```css
.badge-glass  { background: var(--glass-bg); border: 1px solid var(--glass-border); }
.badge-solid  { background: var(--ink-950); color: var(--ink-0); }
.badge-outline { background: transparent; border: 1px solid var(--ink-300); }
```

### 5.5 Modal (全屏毛玻璃弹窗)

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.4);
  backdrop-filter: blur(40px) saturate(200%);
  -webkit-backdrop-filter: blur(40px) saturate(200%);
}
.modal-card {
  width: 100%;
  max-width: 380px;
  padding: 32px;
  background: var(--glass-bg-strong);
  backdrop-filter: blur(40px) saturate(200%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  box-shadow: 0 20px 60px rgba(15,23,42,0.2), 0 1px 0 rgba(255,255,255,0.8) inset;
}
```

---

## 6. 页面布局规范

### 6.1 Section 间距
```css
.section { padding: 80px 0; }       /* 默认 */
.section-lg { padding: 128px 0; }   /* Hero */
.section-sm { padding: 48px 0; }    /* CTA */
```

### 6.2 容器
```css
.container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
```

### 6.3 网格
- 卡片网格：`grid-cols-1 md:grid-cols-3` gap-6
- 商店网格：`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` gap-6
- 高亮卡片：`md:-translate-y-2`（上浮）

---

## 7. 装饰元素

### 7.1 背景
- 顶部光晕：`radial-gradient` 浅紫渐变（不可喧宾夺主）
- 网格底纹：`grid-bg` 仅用于 Hero，opacity 0.3
- 浮动粒子：仅 Hero，颜色统一为 `--ink-300`

### 7.2 分隔
- 横线：`border-b border-ink-200/60`
- 区块分隔：`border-y border-ink-200 bg-ink-50/30`

### 7.3 图标
- 使用 `lucide-react`，统一 `h-5 w-5` 或 `h-6 w-6`
- 强调图标置于黑色方块背景内 `bg-ink-950 text-ink-0 p-2 rounded-lg`

---

## 8. 暗色模式

- 主背景 `--ink-950`
- 卡片 `--glass-bg` (dark)
- 文字 `--ink-100` 主 / `--ink-400` 次
- 玻璃边框 `--glass-border` (dark)
- 强调按钮反白：`bg-ink-100 text-ink-950`

---

## 9. 动效

```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition: 200ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
```

- Hover 上浮：`transform: translateY(-1px)` 200ms
- 阴影变化：`box-shadow` 200ms
- 禁止：旋转、3D 变换、彩色渐变动画

---

## 10. 验收清单

每个新页面/重构页面交付前自检：

- [ ] 使用 8 级灰阶 token，无彩色装饰（除语义色）
- [ ] 表层元素采用毛玻璃质感
- [ ] 字体使用 SF Pro 栈，字阶符合 §3 规范
- [ ] 圆角符合 §4 规范，无 ad-hoc 数值
- [ ] 间距使用 spacer token，无 ad-hoc 数值
- [ ] 暗色模式可用（token 自动覆盖）
- [ ] 按钮主变体为纯黑 `#09090B`
- [ ] 无 emoji 装饰（除非用户明确要求）
- [ ] 移动端响应式（sm/md/lg 断点）
- [ ] 通过 Lighthouse 性能 / 可访问性审计

---

**版本**：v1.0 · 2026-07-04
**维护**：Lynn
**变更需评审**：修改本文件需用户确认
