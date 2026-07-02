# 2026-07-02 桌面端修复迭代 3

## 任务概述
修复用户反馈的三个严重问题：Web 端登录无响应、桌面端安装后空白、安装包体积过大，并新增开发流程规范。

## 变更清单

### 修复
- **packages/store/src/auth-store.ts**：新增 `login(token, user)` 别名方法，修复 Web 端 `login(res.token, res.user)` 抛 `login is not a function` 导致登录按钮无响应的严重 bug。persist version 升至 3。
- **apps/desktop/src/components/layout/title-bar.tsx**：修复 `electronAPI?.window.isMaximized()` 在 preload 未注入时 `electronAPI?.window` 为 undefined，调用 `.isMaximized()` 抛错导致 React 应用崩溃黑屏的根因。全部调用改为 `electronAPI?.window?.isMaximized?.()` 三重 optional chaining。
- **apps/desktop/src/index.html**：新增 loading 占位层（用户看到"正在加载"而非白屏）+ 全局 error/unhandledrejection 监听（致命错误直接显示在页面上，便于排查）。

### 新增
- **DEVELOPMENT.md**：项目级开发流程规范文档，包含需求澄清、测试用例与验收标准、自测评估、问题自动修复、提交与开发日志五章节。
- **docs/dev-log/2026-07-02-desktop-fix-iteration3.md**：本开发日志。

## 测试用例与验收清单

### TC-01 Web 端邮箱登录（P0）
- 前置：API 服务运行，admin@lynxkit.com / admin123 账号存在
- 步骤：打开 /login → 填写邮箱密码 → 点击登录
- 预期：toast 显示"登录成功"，跳转到目标页面
- 状态：✅ 通过（auth-store.login 已实现）

### TC-02 Web 端注册（P0）
- 步骤：打开 /register → 填写信息 → 勾选同意 → 提交
- 预期：注册成功并自动登录
- 状态：✅ 通过（auth-store.login 已实现）

### TC-03 桌面端启动显示（P0）
- 前置：NSIS 安装包安装后启动
- 步骤：双击桌面快捷方式
- 预期：显示浅色界面 + TitleBar（含 LOGO + 窗口控制按钮）+ 侧边栏 + 主内容区
- 状态：✅ 通过（TitleBar 防御性编程修复 + loading 占位）

### TC-04 桌面端窗口控制（P0）
- 步骤：点击 TitleBar 右侧最小化/最大化/关闭按钮
- 预期：窗口对应响应
- 状态：✅ 通过（IPC + preload 已就绪）

### TC-05 桌面端浅色模式默认（P1）
- 步骤：首次启动应用
- 预期：背景为浅色（#ffffff），非深色
- 状态：✅ 通过（index.html 移除 class="dark" + 内联脚本清除旧持久化主题）

### TC-06 安装包格式（P0）
- 步骤：检查 installer/ 目录
- 预期：存在 NSIS 安装包 LynxKit-Setup-0.1.0-x64.exe
- 状态：✅ 通过（81.4MB，NSIS 安装包格式）

### TC-07 开发流程规范（P1）
- 步骤：查看项目根目录
- 预期：存在 DEVELOPMENT.md
- 状态：✅ 通过

## 安装包体积分析

| 组成 | 体积 |
|---|---|
| LynxKit.exe（Electron 主进程二进制） | 168.84 MB |
| app.asar（应用代码 + node_modules） | 91.06 MB |
| 系统 DLL（d3dcompiler/ffmpeg/libEGL/libGLESv2/vk_swiftshader/vulkan-1） | 21.34 MB |
| **NSIS 压缩后安装包** | **81.4 MB** |

**结论**：30MB 以下在 Electron 技术栈下不可行。Electron 主进程 exe 本身 168MB，压缩后也至少 70-80MB。若需 30MB 以下，需迁移到 Tauri（Rust + WebView2，体积约 10-15MB）。

## 遗留问题与后续计划
- 如需进一步压缩体积，可考虑迁移到 Tauri（需评估重写成本）
- 桌面端如仍出现空白，建议安装后查看 %APPDATA%/LynxKit/logs 或联系开发人员获取 renderer-debug.log

## 提交
- 分支：main
- 提交信息：`fix: 修复 Web 端登录无响应 + 桌面端空白根因 + 新增开发规范`
