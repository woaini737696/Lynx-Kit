// ignore_for_file: directives_ordering

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'app.dart';
import 'router.dart';
import 'features/push/push_service.dart';
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

  // 4. 初始化 Firebase（需配置 google-services.json / GoogleService-Info.plist）
  await PushService.instance.initFirebase();

  // 5. 初始化 LocalNotifications
  await PushService.instance.initLocalNotifications();

  // 6. 配置深度链接监听 + 注册推送 token 接收
  await PushService.instance.init();

  // 7. 创建 ProviderContainer 并注入路由（用于 redirect 读取 auth 状态）
  container = ProviderContainer();
  // 触发 auth 状态初始化校验
  container.read(authNotifierProvider);

  runApp(
    UncontrolledProviderScope(
      container: container,
      child: const LynxKitMobileApp(),
    ),
  );
}
