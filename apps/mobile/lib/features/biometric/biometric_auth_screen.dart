// ignore_for_file: directives_ordering

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:local_auth/local_auth.dart';

import 'package:flutter_core/services/auth_service.dart';
import 'package:flutter_core/state/providers.dart';
import 'package:flutter_core/theme/app_colors.dart';

/// 生物识别页
///
/// - 调用 local_auth 验证指纹/Face ID
/// - 验证成功后从 secure storage 读取 token 自动登录
class BiometricAuthScreen extends ConsumerStatefulWidget {
  const BiometricAuthScreen({super.key});

  @override
  ConsumerState<BiometricAuthScreen> createState() => _BiometricAuthScreenState();
}

class _BiometricAuthScreenState extends ConsumerState<BiometricAuthScreen> {
  final LocalAuthentication _localAuth = LocalAuthentication();
  bool _checking = false;

  @override
  void initState() {
    super.initState();
    // 自动触发生物识别
    WidgetsBinding.instance.addPostFrameCallback((_) => _authenticate());
  }

  Future<void> _authenticate() async {
    if (_checking) return;
    setState(() => _checking = true);

    try {
      // 检查设备是否支持生物识别
      final canCheck = await _localAuth.canCheckBiometrics;
      if (!canCheck) {
        _toast('当前设备不支持生物识别');
        return;
      }

      // 验证指纹 / Face ID
      final didAuth = await _localAuth.authenticate(
        localizedReason: '请验证指纹或 Face ID 以登录 LynxKit',
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: true,
        ),
      );

      if (!didAuth) {
        _toast('验证未通过');
        return;
      }

      // 验证成功，从 secure storage 读取 token 自动登录
      await _autoLoginWithToken();
    } catch (e) {
      _toast('验证失败：$e');
    } finally {
      if (mounted) setState(() => _checking = false);
    }
  }

  /// 用缓存的 token 自动登录
  Future<void> _autoLoginWithToken() async {
    try {
      final authService = AuthService();
      final token = await authService.getToken();
      if (token == null || token.isEmpty) {
        _toast('未找到登录凭证，请使用密码登录');
        if (mounted) context.go('/login');
        return;
      }

      // 校验 token 是否有效
      final user = await authService.getCurrentUser();
      if (user == null) {
        _toast('登录已过期，请重新登录');
        if (mounted) context.go('/login');
        return;
      }

      // token 有效，触发 auth 状态更新
      await ref.read(authNotifierProvider.notifier).checkAuth();
      if (mounted) context.go('/home');
    } catch (e) {
      _toast('自动登录失败：$e');
      if (mounted) context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 96,
                  height: 96,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: const Icon(Icons.fingerprint, size: 56, color: AppColors.primary),
                ),
                const SizedBox(height: 24),
                Text('生物识别验证',
                    style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 8),
                Text(
                  _checking ? '正在验证...' : '点击下方按钮验证',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 32),
                if (_checking)
                  const CircularProgressIndicator()
                else
                  ElevatedButton.icon(
                    onPressed: _authenticate,
                    icon: const Icon(Icons.fingerprint),
                    label: const Text('验证生物识别'),
                  ),
                const SizedBox(height: 16),
                TextButton(
                  onPressed: () => context.go('/login'),
                  child: const Text('使用密码登录'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _toast(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }
}
