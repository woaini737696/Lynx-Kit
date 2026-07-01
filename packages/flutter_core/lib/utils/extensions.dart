// ignore_for_file: directives_ordering

import 'package:flutter/material.dart';

import 'package:flutter_core/theme/app_colors.dart';

/// BuildContext 便捷扩展
extension BuildContextExtensions on BuildContext {
  /// 当前 [ThemeData]
  ThemeData get theme => Theme.of(this);

  /// 是否深色模式
  bool get isDark => Theme.of(this).brightness == Brightness.dark;

  /// [AppColors] 便捷访问（按深浅模式返回对应色板）
  AppColorsPalette get colors =>
      isDark ? AppColorsPalette.dark : AppColorsPalette.light;

  /// [MediaQueryData]
  MediaQueryData get mediaQuery => MediaQuery.of(this);

  /// 屏幕宽度
  double get screenWidth => mediaQuery.size.width;

  /// 屏幕高度
  double get screenHeight => mediaQuery.size.height;

  /// 弹 SnackBar
  void showSnackBar(String message, {bool isError = false}) {
    ScaffoldMessenger.of(this).showSnackBar(
      SnackBar(
        content: Text(message),
        behavior: SnackBarBehavior.floating,
        backgroundColor: isError ? AppColors.error : null,
      ),
    );
  }
}

/// 按深浅模式分组的色板（避免在 [BuildContext] 中重复判断）
class AppColorsPalette {
  AppColorsPalette._();

  static const AppColorsPalette light = AppColorsPalette._();
  static const AppColorsPalette dark = AppColorsPalette._();

  bool get _isDark => identical(this, dark);

  Color get background => _isDark ? AppColors.darkBackground : AppColors.lightBackground;
  Color get surface => _isDark ? AppColors.darkSurface : AppColors.lightSurface;
  Color get surfaceVariant => _isDark ? AppColors.darkSurfaceVariant : AppColors.lightSurfaceVariant;
  Color get onSurface => _isDark ? AppColors.darkOnSurface : AppColors.lightOnSurface;
  Color get onSurfaceVariant => _isDark ? AppColors.darkOnSurfaceVariant : AppColors.lightOnSurfaceVariant;
  Color get outline => _isDark ? AppColors.darkOutline : AppColors.lightOutline;
  Color get primary => AppColors.primary;
  Color get success => AppColors.success;
  Color get warning => AppColors.warning;
  Color get error => AppColors.error;
  Color get info => AppColors.info;
}
