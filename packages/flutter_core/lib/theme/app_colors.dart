// ignore_for_file: directives_ordering

import 'package:flutter/material.dart';

/// LynxKit 品牌色板与语义色（暖橙主调）
class AppColors {
  AppColors._();

  /// 主品牌色：暖橙（LynxKit 标志色）
  static const Color primary = Color(0xFFFF6B35);

  /// 主品牌色浅色变体
  static const Color primaryLight = Color(0xFFFF8C61);

  /// 主品牌色深色变体
  static const Color primaryDark = Color(0xFFE5512B);

  /// 主品牌色上的前景色（按钮文字等）
  static const Color onPrimary = Colors.white;

  // ===== 语义色 =====

  /// 成功
  static const Color success = Color(0xFF10B981);

  /// 警告
  static const Color warning = Color(0xFFF59E0B);

  /// 错误
  static const Color error = Color(0xFFEF4444);

  /// 信息
  static const Color info = Color(0xFF3B82F6);

  // ===== 浅色主题 =====

  /// 浅色主题背景
  static const Color lightBackground = Color(0xFFF8FAFC);

  /// 浅色主题表面（卡片）
  static const Color lightSurface = Colors.white;

  /// 浅色主题次级表面
  static const Color lightSurfaceVariant = Color(0xFFF1F5F9);

  /// 浅色主题主文本
  static const Color lightOnSurface = Color(0xFF1E293B);

  /// 浅色主题次级文本
  static const Color lightOnSurfaceVariant = Color(0xFF64748B);

  /// 浅色主题边框/分隔线
  static const Color lightOutline = Color(0xFFE2E8F0);

  // ===== 深色主题 =====

  /// 深色主题背景
  static const Color darkBackground = Color(0xFF0F172A);

  /// 深色主题表面（卡片）
  static const Color darkSurface = Color(0xFF1E293B);

  /// 深色主题次级表面
  static const Color darkSurfaceVariant = Color(0xFF334155);

  /// 深色主题主文本
  static const Color darkOnSurface = Color(0xFFF1F5F9);

  /// 深色主题次级文本
  static const Color darkOnSurfaceVariant = Color(0xFF94A3B8);

  /// 深色主题边框/分隔线
  static const Color darkOutline = Color(0xFF334155);

  // ===== 状态徽章色映射 =====

  /// 项目状态徽章颜色映射
  static Color projectStatusColor(String status) {
    switch (status) {
      case 'deployed':
        return success;
      case 'error':
        return error;
      case 'deploying':
      case 'building':
      case 'generating':
        return warning;
      case 'clarifying':
        return info;
      default:
        return lightOnSurfaceVariant;
    }
  }

  /// 服务器状态徽章颜色映射
  static Color serverStatusColor(String status) {
    switch (status) {
      case 'caddy_ready':
      case 'docker_ready':
      case 'connected':
        return success;
      case 'error':
        return error;
      case 'pending':
        return warning;
      default:
        return lightOnSurfaceVariant;
    }
  }
}
