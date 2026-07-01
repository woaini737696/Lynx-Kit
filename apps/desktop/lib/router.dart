// ignore_for_file: directives_ordering

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'shells/desktop_shell.dart';
import 'features/auth/login_screen.dart';
import 'features/dashboard/dashboard_screen.dart';
import 'features/projects/projects_screen.dart';
import 'features/projects/project_detail_screen.dart';
import 'features/projects/project_wizard_screen.dart';
import 'features/servers/servers_screen.dart';
import 'features/servers/add_server_screen.dart';
import 'features/deploy/deploy_logs_screen.dart';
import 'features/settings/settings_screen.dart';
import 'package:flutter_core/state/providers.dart';
import 'package:flutter_core/state/auth_state.dart';

/// 桌面端路由配置
final GoRouter desktopRouter = GoRouter(
  initialLocation: '/',
  redirect: (context, state) {
    final authState =
        container.read(authNotifierProvider);
    final isLoggedIn = authState is AuthAuthenticated;
    final isOnLogin = state.matchedLocation == '/login';

    if (!isLoggedIn && !isOnLogin) {
      return '/login';
    }
    if (isLoggedIn && isOnLogin) {
      return '/dashboard';
    }
    return null;
  },
  routes: <RouteBase>[
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    ShellRoute(
      builder: (context, state, child) => DesktopShell(child: child),
      routes: <RouteBase>[
        GoRoute(
          path: '/',
          redirect: (_, __) => '/dashboard',
        ),
        GoRoute(
          path: '/dashboard',
          builder: (context, state) => const DashboardScreen(),
        ),
        GoRoute(
          path: '/projects',
          builder: (context, state) => const ProjectsScreen(),
        ),
        GoRoute(
          path: '/projects/new',
          builder: (context, state) => const ProjectWizardScreen(),
        ),
        GoRoute(
          path: '/projects/:id',
          builder: (context, state) =>
              ProjectDetailScreen(projectId: state.pathParameters['id']!),
        ),
        GoRoute(
          path: '/servers',
          builder: (context, state) => const ServersScreen(),
        ),
        GoRoute(
          path: '/servers/new',
          builder: (context, state) => const AddServerScreen(),
        ),
        GoRoute(
          path: '/deploy/:projectId/logs',
          builder: (context, state) => DeployLogsScreen(
            projectId: state.pathParameters['projectId']!,
          ),
        ),
        GoRoute(
          path: '/settings',
          builder: (context, state) => const SettingsScreen(),
        ),
      ],
    ),
  ],
);

/// 全局 ProviderContainer 引用（用于路由 redirect 读取 auth 状态）
///
/// TODO(week1): 生产应使用 GoRouter 的 refreshListener 监听 auth 状态，
/// 此处为简化实现，在 main 中注入。详见 router 改造说明。
late final ProviderContainer container;
