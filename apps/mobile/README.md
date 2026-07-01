# LynxKit 移动端应用

LynxKit AI 驱动的零代码产品构建平台 —— 移动端（轻型互补：状态总览 / 推送 / 扫码 / 生物识别 / 对话式快改）。

## 技术栈

- Flutter 3.x (Dart 3)
- 状态管理：flutter_riverpod
- 路由：go_router
- 推送：firebase_messaging
- 生物识别：local_auth
- 扫码：mobile_scanner
- 相册：image_picker
- 深度链接：app_links
- 本地通知：flutter_local_notifications
- 共享核心：`packages/flutter_core`（85%+ 代码复用）

## 开发流程

### 1. 安装 Flutter SDK

安装 Flutter 3.22+（Dart 3.4+），参考 [flutter.dev](https://flutter.dev)。

### 2. 生成平台文件

首次运行前，需生成 iOS / Android 平台目录：

```bash
cd apps/mobile
flutter create . --platforms=ios,android
```

### 3. 配置 Firebase

- **Android**：将 `google-services.json` 放到 `apps/mobile/android/app/`
- **iOS**：将 `GoogleService-Info.plist` 放到 `apps/mobile/ios/Runner/`
- 在 `android/app/build.gradle` 中添加 Google Services 插件

### 4. 安装依赖

```bash
cd packages/flutter_core && flutter pub get
cd apps/mobile && flutter pub get
```

### 5. 运行

```bash
flutter run -d android
# 或
flutter run -d ios   # 需 macOS 环境
```

> iOS 构建需 macOS 环境 + Xcode。

## 功能模块

| 模块 | 说明 |
|------|------|
| 登录 | 邮箱密码登录 + 生物识别登录入口 |
| 首页 | 欢迎卡片 + 项目状态总览 + 服务器状态 |
| 项目 | 项目列表 + 详情（简化版） |
| 通知 | 部署通知列表 + 已读/未读 |
| 扫码 | mobile_scanner 实时扫码部署 |
| 生物识别 | local_auth 验证指纹 / Face ID |
| 对话式快改 | AI 对话气泡（占位）+ 输入框 |
| 个人中心 | 用户信息 + 设置菜单 |

## 后端对接

- API 基地址：`http://localhost:4000`
- tRPC 端点：`/trpc/*`
- OpenAPI spec：`http://localhost:4000/openapi.json`
