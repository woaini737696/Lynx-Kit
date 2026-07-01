// ignore_for_file: directives_ordering

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:flutter_core/models/user.dart';
import 'package:flutter_core/services/auth_service.dart';
import 'package:flutter_core/services/api_client.dart';

/// 认证状态联合类型
sealed class AuthState {
  const AuthState();
}

/// 加载中（启动时校验 token）
class AuthLoading extends AuthState {
  const AuthLoading();
}

/// 未登录
class AuthUnauthenticated extends AuthState {
  const AuthUnauthenticated();
}

/// 已登录
class AuthAuthenticated extends AuthState {
  const AuthAuthenticated(this.user);
  final User user;
}

/// 认证出错
class AuthError extends AuthState {
  const AuthError(this.message);
  final String message;
}

/// 认证状态 Notifier（Riverpod AsyncNotifier）
///
/// 登录状态缓存说明：任务要求用 SharedPreferences 缓存登录状态，
/// 但 flutter_core 未引入 shared_preferences；此处复用 [AuthService.getCachedUser]
/// （基于 flutter_secure_storage）作为登录态缓存，等价且更安全。
class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._authService) : super(const AuthLoading()) {
    // 启动时自动校验登录态
    checkAuth();
  }

  final AuthService _authService;

  /// 校验当前登录态：有缓存用户即认为登录中，并尝试拉取最新用户信息
  Future<void> checkAuth() async {
    state = const AuthLoading();
    try {
      final cached = await _authService.getCachedUser();
      if (cached == null) {
        // 缓存无用户，可能 token 仍在但缓存丢失，尝试拉取
        final fresh = await _authService.getCurrentUser();
        if (fresh == null) {
          state = const AuthUnauthenticated();
        } else {
          state = AuthAuthenticated(fresh);
        }
        return;
      }
      state = AuthAuthenticated(cached);
      // 后台刷新最新用户信息（不阻塞 UI）
      _refreshUser();
    } catch (e) {
      debugPrint('[AuthNotifier] checkAuth 失败: $e');
      state = const AuthUnauthenticated();
    }
  }

  Future<void> _refreshUser() async {
    try {
      final fresh = await _authService.getCurrentUser();
      if (fresh != null) {
        state = AuthAuthenticated(fresh);
      }
    } catch (e) {
      // 后台刷新失败不改变现有状态
      debugPrint('[AuthNotifier] 后台刷新用户失败: $e');
    }
  }

  /// 登录
  Future<void> login(String email, String password) async {
    state = const AuthLoading();
    try {
      final result = await _authService.login(email, password);
      state = AuthAuthenticated(result.user);
    } catch (e) {
      state = AuthError(e.toString());
      rethrow;
    }
  }

  /// 注册
  Future<void> register(String email, String password, {String? name}) async {
    state = const AuthLoading();
    try {
      final result = await _authService.register(email, password, name: name);
      state = AuthAuthenticated(result.user);
    } catch (e) {
      state = AuthError(e.toString());
      rethrow;
    }
  }

  /// 退出登录
  Future<void> logout() async {
    await _authService.logout();
    state = const AuthUnauthenticated();
  }

  /// 401 未授权时由 ApiClient 回调，重置为未登录
  void markUnauthorized() {
    state = const AuthUnauthenticated();
  }
}
