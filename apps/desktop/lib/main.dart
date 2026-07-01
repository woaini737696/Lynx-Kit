// ignore_for_file: directives_ordering

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:window_manager/window_manager.dart';

import 'app.dart';
import 'router.dart';
import 'features/tray/tray_manager.dart';
import 'features/shortcuts/hotkey_manager.dart';
import 'package:flutter_core/services/api_client.dart';
import 'package:flutter_core/services/auth_service.dart';
import 'package:flutter_core/state/providers.dart';

Future<void> main() async {
  // 1. 初始化 Flutter 绑定
  WidgetsFlutterBinding.ensureInitialized();

  // 2. 初始化 Hive 本地存储
  await Hive.initFlutter();

  // 3. 初始化 ApiClient（注入后端地址）
  ApiClient.init();
  // 将 tokenProvider 绑定到 AuthService（使 ApiClient 自动携带 Bearer）
  final authService = AuthService();
  ApiClient.tokenProvider = authService.getToken;
  ApiClient.tokenClearer = authService.clearToken;

  // 4. 初始化 WindowManager（设置最小窗口尺寸 1024x720）
  await windowManager.ensureInitialized();
  await windowManager.waitUntilReadyToShow(
    const WindowOptions(
      size: Size(1440, 900),
      minimumSize: Size(1024, 720),
      title: 'LynxKit',
      titleBarStyle: TitleBarStyle.normal,
    ),
    () async {
      await windowManager.show();
      await windowManager.focus();
    },
  );

  // 5. 初始化 TrayManager（系统托盘）
  await TrayManagerService.instance.init();

  // 6. 初始化 HotKeyManager（全局快捷键 Ctrl+Shift+L 唤起应用）
  await HotkeyManagerService.instance.init();

  // 7. 创建 ProviderContainer 并注入路由（用于 redirect 读取 auth 状态）
  container = ProviderContainer();
  // 触发 auth 状态初始化校验
  container.read(authNotifierProvider);

  runApp(
    UncontrolledProviderScope(
      container: container,
      child: const LynxKitDesktopApp(),
    ),
  );
}
