# LynxKit 桌面端应用

LynxKit AI 驱动的零代码产品构建平台 —— 桌面端（重型操作：项目创建向导 / 代码编辑 / SSH 服务器管理 / 多窗口 / 系统托盘）。

## 技术栈

- Flutter 3.x (Dart 3)
- 状态管理：flutter_riverpod
- 路由：go_router
- 系统集成：tray_manager, window_manager, hotkey_manager, multi_window_manager
- 文件：file_picker, desktop_drop
- 代码编辑：re_editor
- 共享核心：`packages/flutter_core`（85%+ 代码复用）

## 开发流程

### 1. 安装 Flutter SDK

安装 Flutter 3.22+（Dart 3.4+），参考 [flutter.dev](https://flutter.dev)。

### 2. 生成平台文件

首次运行前，需生成 Windows / macOS / Linux 平台目录：

```bash
cd apps/desktop
flutter create . --platforms=windows,macos,linux
```

### 3. 安装依赖

```bash
cd packages/flutter_core && flutter pub get
cd apps/desktop && flutter pub get
```

### 4. 运行

```bash
flutter run -d windows
# 或
flutter run -d macos
# 或
flutter run -d linux
```

## 功能模块

| 模块 | 说明 |
|------|------|
| 登录 | 邮箱密码登录，调用 `/trpc/auth.login` |
| 主控台 | 项目数 / 服务器数 / 部署数统计 + 最近项目 |
| 项目 | 项目列表 / 详情 / 创建向导（4 步） |
| 服务器 | 服务器列表 / 添加（含 SSH 测试连接） |
| 部署 | 部署日志 + 状态徽章 + 进度条 |
| 设置 | 用户资料 / 主题切换 / 关于 / 退出 |
| 系统托盘 | 最小化到托盘，右键显示 / 退出 |
| 全局快捷键 | Ctrl+Shift+L 唤起应用 |

## 后端对接

- API 基地址：`http://localhost:4000`
- tRPC 端点：`/trpc/*`
- OpenAPI spec：`http://localhost:4000/openapi.json`
