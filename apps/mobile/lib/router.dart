// ignore_for_file: directives_ordering

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'shells/mobile_shell.dart';
import 'features/auth/login_screen.dart';
import 'features/home/home_screen.dart';
import 'features/projects/projects_screen.dart';
import 'features/projects/project_detail_screen.dart';
import 'features/notifications/notifications_screen.dart';
import 'features/profile/profile_screen.dart';
import 'features/scan/qr_scanner_screen.dart';
import 'features/biometric/biometric_auth_screen.dart';
import 'features/quick_edit/quick_edit_screen.dart';
import 'package:flutter_core/state/providers.dart';
import 'package:flutter_core/state/auth_state.dart';

/// 移动端路由配置
final GoRouter mobileRouter = GoRouter(
  initialLocation: '/',
  redirect: (context, state) {
    final authState = container.read(authNotifierProvider);
    final isLoggedIn = authState is AuthAuthenticated;
    final isOnLogin = state.matchedLocation == '/login';
    final isOnBiometric = state.matchedLocation == '/biometric';

    if (!isLoggedIn && !isOnLogin && !isOnBiometric) {
      return '/login';
    }
    if (isLoggedIn && isOnLogin) {
      return '/home';
    }
    return null;
  },
  routes: <RouteBase>[
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/biometric',
      builder: (context, state) => const BiometricAuthScreen(),
    ),
    GoRoute(
      path: '/scan',
      builder: (context, state) => const QrScannerScreen(),
    ),
    ShellRoute(
      builder: (context, state, child) => MobileShell(child: child),
      routes: <RouteBase>[
        GoRoute(
          path: '/',
          redirect: (_, __) => '/home',
        ),
        GoRoute(
          path: '/home',
          builder: (context, state) => const HomeScreen(),
        ),
        GoRoute(
          path: '/projects',
          builder: (context, state) => const ProjectsScreen(),
        ),
        GoRoute(
          path: '/projects/:id',
          builder: (context, state) =>
              ProjectDetailScreen(projectId: state.pathParameters['id']!),
        ),
        GoRoute(
          path: '/projects/:id/quick-edit',
          builder: (context, state) => QuickEditScreen(
            projectId: state.pathParameters['id']!,
          ),
        ),
        GoRoute(
          path: '/notifications',
          builder: (context, state) => const NotificationsScreen(),
        ),
        GoRoute(
          path: '/profile',
          builder: (context, state) => const ProfileScreen(),
        ),
      ],
    ),
  ],
);

/// 全局 ProviderContainer 引用（用于路由 redirect 读取 auth 状态）
late final ProviderContainer container;
