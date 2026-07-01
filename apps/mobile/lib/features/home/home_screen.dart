// ignore_for_file: directives_ordering

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:flutter_core/state/providers.dart';
import 'package:flutter_core/state/auth_state.dart';
import 'package:flutter_core/theme/app_colors.dart';
import 'package:flutter_core/widgets/empty_state.dart';
import 'package:flutter_core/widgets/project_card.dart';
import 'package:flutter_core/widgets/server_card.dart';

/// 移动端状态总览页
///
/// - 顶部欢迎卡片
/// - 项目状态总览（RefreshIndicator + ListView）
/// - 服务器状态卡片
/// - "扫码部署" FAB
class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(projectListNotifierProvider.notifier).refresh();
      ref.read(serverListNotifierProvider.notifier).refresh();
    });
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authNotifierProvider);
    final user = authState is AuthAuthenticated ? authState.user : null;
    final projectState = ref.watch(projectListNotifierProvider);
    final serverState = ref.watch(serverListNotifierProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('LynxKit')),
      body: RefreshIndicator(
        onRefresh: () async {
          await Future.wait([
            ref.read(projectListNotifierProvider.notifier).refresh(),
            ref.read(serverListNotifierProvider.notifier).refresh(),
          ]);
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // 欢迎卡片
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.primary, AppColors.primaryDark],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('你好，${user?.name ?? '用户'} 👋',
                      style: const TextStyle(
                          color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text('你有 ${projectState.items.length} 个项目正在运行',
                      style: const TextStyle(color: Colors.white70)),
                ],
              ),
            ),
            const SizedBox(height: 24),
            // 项目状态总览
            Row(
              children: [
                Text('项目总览', style: Theme.of(context).textTheme.titleMedium),
                const Spacer(),
                TextButton(
                  onPressed: () => context.go('/projects'),
                  child: const Text('查看全部'),
                ),
              ],
            ),
            if (projectState.items.isEmpty)
              const EmptyState(icon: Icons.folder_open, title: '暂无项目')
            else
              ...projectState.items.take(3).map(
                    (p) => ProjectCard(
                      project: p,
                      onTap: () => context.go('/projects/${p.id}'),
                    ),
                  ),
            const SizedBox(height: 24),
            // 服务器状态卡片
            Text('服务器状态', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            if (serverState.items.isEmpty)
              const EmptyState(icon: Icons.dns_outlined, title: '暂无服务器')
            else
              ...serverState.items.take(2).map(
                    (s) => ServerCard(server: s),
                  ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.go('/scan'),
        icon: const Icon(Icons.qr_code_scanner),
        label: const Text('扫码部署'),
      ),
    );
  }
}
