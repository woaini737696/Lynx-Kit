// ignore_for_file: directives_ordering

import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:app_links/app_links.dart';

import 'package:flutter_core/services/api_client.dart';
import 'package:flutter_core/utils/constants.dart';

/// 推送服务（单例）
///
/// - 初始化 firebase_messaging
/// - 请求通知权限
/// - 获取 FCM token 并上报后端
/// - 监听推送消息
/// - 处理深度链接跳转
class PushService {
  PushService._();

  static final PushService instance = PushService._();

  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  bool _initialized = false;

  /// 初始化 Firebase（需配置平台文件）
  Future<void> initFirebase() async {
    // TODO(week1): 接入 Firebase
    // try {
    //   await Firebase.initializeApp();
    // } catch (e) {
    //   debugPrint('[PushService] Firebase 初始化失败: $e');
    // }
    debugPrint('[PushService] Firebase 初始化占位（需配置 google-services.json / GoogleService-Info.plist）');
  }

  /// 初始化本地通知
  Future<void> initLocalNotifications() async {
    try {
      const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
      const iosInit = DarwinInitializationSettings();
      const settings = InitializationSettings(android: androidInit, iOS: iosInit);
      await _localNotifications.initialize(settings);
      debugPrint('[PushService] 本地通知已初始化');
    } catch (e) {
      debugPrint('[PushService] 本地通知初始化失败: $e');
    }
  }

  /// 完整初始化：请求权限 + 获取 token + 监听消息 + 深度链接
  Future<void> init() async {
    if (_initialized) return;

    try {
      await _requestPermission();
      await _registerFcmToken();
      _listenMessages();
      _listenDeepLinks();
      _initialized = true;
      debugPrint('[PushService] 推送服务已初始化');
    } catch (e) {
      debugPrint('[PushService] 初始化失败: $e');
    }
  }

  /// 请求通知权限
  Future<void> _requestPermission() async {
    // TODO(week1): 接入 firebase_messaging 权限请求
    // final messaging = FirebaseMessaging.instance;
    // await messaging.requestPermission(alert: true, badge: true, sound: true);
    debugPrint('[PushService] 通知权限请求占位');
  }

  /// 获取 FCM token 并上报后端
  Future<void> _registerFcmToken() async {
    // TODO(week1): 接入 firebase_messaging 获取 token
    // final token = await FirebaseMessaging.instance.getToken();
    // if (token != null) {
    //   await _reportToken(token);
    // }
    debugPrint('[PushService] FCM token 获取占位');
  }

  /// 上报设备 token 到后端
  Future<void> _reportToken(String token) async {
    try {
      await ApiClient.instance.post(
        '${AppConstants.trpcPrefix}/user.registerDevice',
        data: <String, dynamic>{'token': token},
      );
      debugPrint('[PushService] 设备 token 已上报');
    } catch (e) {
      debugPrint('[PushService] token 上报失败: $e');
    }
  }

  /// 监听前台推送消息
  void _listenMessages() {
    // TODO(week1): 接入 firebase_messaging onMessage
    // FirebaseMessaging.onMessage.listen((message) {
    //   final notification = message.notification;
    //   if (notification != null) {
    //     _showLocalNotification(notification);
    //   }
    // });
  }

  /// 显示本地通知
  Future<void> _showLocalNotification({
    required String title,
    required String body,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'lynxkit_default',
      'LynxKit 通知',
      importance: Importance.high,
    );
    const iosDetails = DarwinNotificationDetails();
    const details = NotificationDetails(android: androidDetails, iOS: iosDetails);
    await _localNotifications.show(0, title, body, details);
  }

  /// 监听深度链接
  void _listenDeepLinks() {
    try {
      final appLinks = AppLinks();
      appLinks.uriLinkStream.listen((uri) {
        debugPrint('[PushService] 深度链接: $uri');
        // TODO(week1): 解析 uri 并跳转对应页面
      });
    } catch (e) {
      debugPrint('[PushService] 深度链接监听失败: $e');
    }
  }

  /// 释放资源
  void dispose() {
    _initialized = false;
  }
}
