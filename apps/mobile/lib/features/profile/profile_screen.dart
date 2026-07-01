// ignore_for_file: directives_ordering

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:flutter_core/state/providers.dart';
import 'package:flutter_core/state/auth_state.dart';

/// 个人中心
///
/// - 用户信息卡片
/// - 菜单：我的项目/服务器状态/通知设置/生物识别/关于/退出登录
class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authNotifierProvider);
    final user = authState is AuthAuthenticated ? authState.user : null;

    return Scaffold(
      appBar: AppBar(title: const Text('我的')),
      body: ListView(
        children: [
          // 用户信息卡片
          Container(
            padding: const EdgeInsets.all(24),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 36,
                  backgroundColor: Theme.of(context).colorScheme.primary.withOpacity(0.12),
                  child: Text(
                    (user?.name?.isNotEmpty == true ? user!.name : user?.email ?? 'U')[0].toUpperCase(),
                    style: TextStyle(fontSize: 28, color: Theme.of(context).colorScheme.primary),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(user?.name ?? '未设置昵称',
                          style: Theme.of(context).textTheme.titleMedium),
                      Text(user?.email ?? '-',
                          style: Theme.of(context).textTheme.bodySmall),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const Divider(),
          _MenuItem(
            icon: Icons.folder_outlined,
            title: '我的项目',
            onTap: () => context.go('/projects'),
          ),
          _MenuItem(
            icon: Icons.dns_outlined,
            title: '服务器状态',
            onTap: () {
              // TODO(week1): 跳转服务器状态页（移动端简化）
            },
          ),
          _MenuItem(
            icon: Icons.notifications_outlined,
            title: '通知设置',
            onTap: () {
              // TODO(week1): 跳转系统通知设置
            },
          ),
          _MenuItem(
            icon: Icons.fingerprint,
            title: '生物识别登录',
            subtitle: '使用指纹 / Face ID 快速登录',
            onTap: () => context.go('/biometric'),
          ),
          _MenuItem(
            icon: Icons.info_outline,
            title: '关于',
            onTap: () => _showAbout(context),
          ),
          const Divider(),
          _MenuItem(
            icon: Icons.logout,
            title: '退出登录',
            color: Colors.red,
            onTap: () async {
              await ref.read(authNotifierProvider.notifier).logout();
              if (context.mounted) context.go('/login');
            },
          ),
        ],
      ),
    );
  }

  void _showAbout(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => const AboutDialog(
        applicationName: 'LynxKit',
        applicationVersion: '0.1.0',
        applicationLegalese: 'AI 驱动的零代码产品构建平台',
      ),
    );
  }
}

class _MenuItem extends StatelessWidget {
  const _MenuItem({
    required this.icon,
    required this.title,
    this.subtitle,
    this.color,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final Color? color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: color ?? Theme.of(context).iconTheme.color),
      title: Text(title, style: TextStyle(color: color)),
      subtitle: subtitle != null ? Text(subtitle!) : null,
      trailing: Icon(Icons.chevron_right, color: Theme.of(context).dividerColor),
      onTap: onTap,
    );
  }
}
