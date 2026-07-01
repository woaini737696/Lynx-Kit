// ignore_for_file: directives_ordering

import 'package:flutter/material.dart';

import 'app_colors.dart';

/// LynxKit 字体配置（Material 3 TextTheme 适配）
class AppTypography {
  AppTypography._();

  /// 默认字体族（系统字体，可后续替换为自定义字体包）
  static const String fontFamily = null;

  /// 字重
  static const FontWeight regular = FontWeight.w400;
  static const FontWeight medium = FontWeight.w500;
  static const FontWeight semiBold = FontWeight.w600;
  static const FontWeight bold = FontWeight.w700;

  /// 浅色主题文本主题
  static TextTheme lightTextTheme = TextTheme(
    displayLarge: TextStyle(
      fontSize: 32,
      fontWeight: bold,
      color: AppColors.lightOnSurface,
      height: 1.2,
    ),
    displayMedium: TextStyle(
      fontSize: 24,
      fontWeight: bold,
      color: AppColors.lightOnSurface,
      height: 1.3,
    ),
    headlineSmall: TextStyle(
      fontSize: 20,
      fontWeight: semiBold,
      color: AppColors.lightOnSurface,
      height: 1.4,
    ),
    titleLarge: TextStyle(
      fontSize: 18,
      fontWeight: semiBold,
      color: AppColors.lightOnSurface,
      height: 1.4,
    ),
    titleMedium: TextStyle(
      fontSize: 16,
      fontWeight: medium,
      color: AppColors.lightOnSurface,
      height: 1.5,
    ),
    bodyLarge: TextStyle(
      fontSize: 16,
      fontWeight: regular,
      color: AppColors.lightOnSurface,
      height: 1.5,
    ),
    bodyMedium: TextStyle(
      fontSize: 14,
      fontWeight: regular,
      color: AppColors.lightOnSurface,
      height: 1.5,
    ),
    bodySmall: TextStyle(
      fontSize: 12,
      fontWeight: regular,
      color: AppColors.lightOnSurfaceVariant,
      height: 1.4,
    ),
    labelLarge: TextStyle(
      fontSize: 14,
      fontWeight: medium,
      color: AppColors.lightOnSurface,
    ),
    labelSmall: TextStyle(
      fontSize: 11,
      fontWeight: medium,
      color: AppColors.lightOnSurfaceVariant,
    ),
  );

  /// 深色主题文本主题
  static TextTheme darkTextTheme = TextTheme(
    displayLarge: TextStyle(
      fontSize: 32,
      fontWeight: bold,
      color: AppColors.darkOnSurface,
      height: 1.2,
    ),
    displayMedium: TextStyle(
      fontSize: 24,
      fontWeight: bold,
      color: AppColors.darkOnSurface,
      height: 1.3,
    ),
    headlineSmall: TextStyle(
      fontSize: 20,
      fontWeight: semiBold,
      color: AppColors.darkOnSurface,
      height: 1.4,
    ),
    titleLarge: TextStyle(
      fontSize: 18,
      fontWeight: semiBold,
      color: AppColors.darkOnSurface,
      height: 1.4,
    ),
    titleMedium: TextStyle(
      fontSize: 16,
      fontWeight: medium,
      color: AppColors.darkOnSurface,
      height: 1.5,
    ),
    bodyLarge: TextStyle(
      fontSize: 16,
      fontWeight: regular,
      color: AppColors.darkOnSurface,
      height: 1.5,
    ),
    bodyMedium: TextStyle(
      fontSize: 14,
      fontWeight: regular,
      color: AppColors.darkOnSurface,
      height: 1.5,
    ),
    bodySmall: TextStyle(
      fontSize: 12,
      fontWeight: regular,
      color: AppColors.darkOnSurfaceVariant,
      height: 1.4,
    ),
    labelLarge: TextStyle(
      fontSize: 14,
      fontWeight: medium,
      color: AppColors.darkOnSurface,
    ),
    labelSmall: TextStyle(
      fontSize: 11,
      fontWeight: medium,
      color: AppColors.darkOnSurfaceVariant,
    ),
  );
}
