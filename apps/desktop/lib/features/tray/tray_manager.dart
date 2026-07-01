// ignore_for_file: directives_ordering

import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:tray_manager/tray_manager.dart';
import 'package:window_manager/window_manager.dart';

/// 系统托盘服务（单例）
///
/// 创建系统托盘 + 右键菜单（显示主窗口/退出），
/// 监听托盘点击事件以显示主窗口。
class TrayManagerService with TrayListener {
  TrayManagerService._();

  static final TrayManagerService instance = TrayManagerService._();

  bool _initialized = false;

  /// 初始化系统托盘
  Future<void> init() async {
    if (_initialized) return;

    try {
      // 托盘图标（使用 Flutter 内置资源，实际项目应替换为自定义图标）
      final iconPath = _iconPath();
      if (iconPath != null) {
        await trayManager.setIcon(iconPath);
      }

      await trayManager.setToolTip('LynxKit - AI 产品构建平台');

      // 右键菜单
      final menu = Menu(
        items: [
          MenuItem(key: 'show', label: '显示主窗口'),
          MenuItem.separator(),
          MenuItem(key: 'quit', label: '退出'),
        ],
      );
      await trayManager.setContextMenu(menu);

      trayManager.addListener(this);
      _initialized = true;
      debugPrint('[TrayManagerService] 系统托盘已初始化');
    } catch (e) {
      debugPrint('[TrayManagerService] 初始化失败: $e');
    }
  }

  /// 平台对应的图标路径（TODO: 替换为实际图标资源）
  String? _iconPath() {
    if (Platform.isWindows) {
      return 'assets/app_icon.ico';
    } else if (Platform.isMacOS) {
      return 'assets/app_icon.png';
    } else if (Platform.isLinux) {
      return 'assets/app_icon.png';
    }
    return null;
  }

  @override
  void onTrayIconMouseDown() {
    _showWindow();
  }

  @override
  void onTrayIconRightMouseDown() {
    // 右键菜单由 trayManager 自动处理
  }

  @override
  void onTrayMenuItemClick(MenuItem menuItem) {
    switch (menuItem.key) {
      case 'show':
        _showWindow();
      case 'quit':
        _quitApp();
    }
  }

  Future<void> _showWindow() async {
    await windowManager.show();
    await windowManager.focus();
  }

  void _quitApp() {
    trayManager.destroy();
    windowManager.destroy();
  }

  /// 销毁托盘
  Future<void> dispose() async {
    if (_initialized) {
      trayManager.removeListener(this);
      await trayManager.destroy();
      _initialized = false;
    }
  }
}
