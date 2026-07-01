// ignore_for_file: directives_ordering

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:flutter_core/state/providers.dart';
import 'package:flutter_core/state/auth_state.dart';

/// 设置页：用户资料编辑 + 主题切换 + 关于 + 退出登录
class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  ThemeMode _themeMode = ThemeMode.system;

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authNotifierProvider);
    final user = authState is AuthAuthenticated ? authState.user : null;

    return Scaffold(
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text('设置', style: Theme.of(context).textTheme.displayMedium),
          const SizedBox(height: 24),
          // 用户资料编辑
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('用户资料', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 32,
                        backgroundColor: Theme.of(context).colorScheme.primary.withOpacity(0.12),
                        child: Text(
                          (user?.name?.isNotEmpty == true ? user!.name : user?.email ?? 'U')[0].toUpperCase(),
                          style: TextStyle(fontSize: 24, color: Theme.of(context).colorScheme.primary),
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
                  const SizedBox(height: 16),
                  const TextField(
                    decoration: InputDecoration(
                      labelText: '昵称',
                      prefixIcon: Icon(Icons.person_outline),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: () {
                        // TODO(week1): 调用 auth/user update
                        _toast('资料更新待接入');
                      },
                      child: const Text('保存资料'),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          // 主题切换
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('外观', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 12),
                  SegmentedButton<ThemeMode>(
                    segments: const [
                      ButtonSegment(value: ThemeMode.light, label: Text('浅色'), icon: Icon(Icons.light_mode)),
                      ButtonSegment(value: ThemeMode.dark, label: Text('深色'), icon: Icon(Icons.dark_mode)),
                      ButtonSegment(value: ThemeMode.system, label: Text('跟随系统'), icon: Icon(Icons.settings_brightness)),
                    ],
                    selected: {_themeMode},
                    onSelectionChanged: (set) => setState(() => _themeMode = set.first),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          // 关于
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.info_outline),
                  title: const Text('关于 LynxKit'),
                  subtitle: const Text('版本 0.1.0'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => _showAbout(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // 退出登录
          Card(
            child: ListTile(
              leading: const Icon(Icons.logout, color: Colors.red),
              title: const Text('退出登录', style: TextStyle(color: Colors.red)),
              onTap: () async {
                await ref.read(authNotifierProvider.notifier).logout();
                if (context.mounted) context.go('/login');
              },
            ),
          ),
        ],
      ),
    );
  }

  void _showAbout() {
    showDialog(
      context: context,
      builder: (context) => const AboutDialog(
        applicationName: 'LynxKit',
        applicationVersion: '0.1.0',
        applicationLegalese: 'AI 驱动的零代码产品构建平台',
      ),
    );
  }

  void _toast(String msg) {
    ScaffoldMessenger.of(this.context).showSnackBar(SnackBar(content: Text(msg)));
  }
}
