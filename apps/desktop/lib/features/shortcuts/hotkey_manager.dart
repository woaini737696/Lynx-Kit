// ignore_for_file: directives_ordering

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:hotkey_manager/hotkey_manager.dart';
import 'package:window_manager/window_manager.dart';

/// 全局快捷键服务（单例）
///
/// 注册全局快捷键 Ctrl+Shift+L 唤起应用窗口。
class HotkeyManagerService {
  HotkeyManagerService._();

  static final HotkeyManagerService instance = HotkeyManagerService._();

  bool _initialized = false;

  /// 初始化并注册全局快捷键
  Future<void> init() async {
    if (_initialized) return;

    try {
      await hotKeyManager.unregisterAll();

      // 注册 Ctrl+Shift+L 全局快捷键唤起应用
      final hotKey = HotKey(
        key: PhysicalKeyboardKey.keyL,
        modifiers: <HotKeyModifier>[
          HotKeyModifier.control,
          HotKeyModifier.shift,
        ],
      );

      await hotKeyManager.register(
        hotKey,
        callback: _onHotKeyTriggered,
      );

      _initialized = true;
      debugPrint('[HotkeyManagerService] 已注册全局快捷键 Ctrl+Shift+L');
    } catch (e) {
      debugPrint('[HotkeyManagerService] 注册失败: $e');
    }
  }

  Future<void> _onHotKeyTriggered() async {
    debugPrint('[HotkeyManagerService] 快捷键触发，显示窗口');
    await windowManager.show();
    await windowManager.focus();
  }

  /// 注销快捷键并释放资源
  Future<void> dispose() async {
    if (_initialized) {
      await hotKeyManager.unregisterAll();
      _initialized = false;
    }
  }
}
