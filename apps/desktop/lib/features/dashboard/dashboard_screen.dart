// ignore_for_file: directives_ordering

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:flutter_core/widgets/empty_state.dart';
import 'package:flutter_core/widgets/loading_indicator.dart';
import 'package:flutter_core/widgets/project_card.dart';
import 'package:flutter_core/state/providers.dart';
import 'package:flutter_core/theme/app_colors.dart';

/// 主控台：统计卡片 + 最近项目 + 最近部署活动
class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    // 初始化时拉取数据
    Future.microtask(() {
      ref.read(projectListNotifierProvider.notifier).refresh();
      ref.read(serverListNotifierProvider.notifier).refresh();
    });
  }

  @override
  Widget build(BuildContext context) {
    final projectState = ref.watch(projectListNotifierProvider);
    final serverState = ref.watch(serverListNotifierProvider);

    return Scaffold(
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('主控台', style: Theme.of(context).textTheme.displayMedium),
            const SizedBox(height: 24),
            // 统计卡片
            Row(
              children: [
                _StatCard(
                  title: '项目数',
                  value: '${projectState.items.length}',
                  icon: Icons.folder,
                  color: AppColors.primary,
                ),
                const SizedBox(width: 16),
                _StatCard(
                  title: '服务器数',
                  value: '${serverState.items.length}',
                  icon: Icons.dns,
                  color: AppColors.info,
                ),
                const SizedBox(width: 16),
                const _StatCard(
                  title: '已部署',
                  value: '0',
                  icon: Icons.cloud_done,
                  color: AppColors.success,
                ),
              ],
            ),
            const SizedBox(height: 32),
            // 最近项目
            Text('最近项目', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            if (projectState.isLoading)
              const LoadingIndicator()
            else if (projectState.items.isEmpty)
              EmptyState(
                icon: Icons.folder_open,
                title: '还没有项目',
                message: '点击"新建项目"开始构建你的第一个产品',
                actionLabel: '新建项目',
                onAction: () => context.go('/projects/new'),
              )
            else
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                  maxCrossAxisExtent: 360,
                  childAspectRatio: 1.4,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                ),
                itemCount: projectState.items.length > 6
                    ? 6
                    : projectState.items.length,
                itemBuilder: (context, index) {
                  final project = projectState.items[index];
                  return ProjectCard(
                    project: project,
                    onTap: () => context.go('/projects/${project.id}'),
                  );
                },
              ),
            const SizedBox(height: 32),
            // 最近部署活动（占位）
            Text('最近部署活动', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            const EmptyState(
              icon: Icons.history,
              title: '暂无部署记录',
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.go('/projects/new'),
        icon: const Icon(Icons.add),
        label: const Text('新建项目'),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  final String title;
  final String value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color),
              ),
              const SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: Theme.of(context).textTheme.bodySmall),
                  const SizedBox(height: 4),
                  Text(value, style: Theme.of(context).textTheme.displayMedium),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
