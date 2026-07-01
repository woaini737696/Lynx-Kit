// ignore_for_file: directives_ordering

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:flutter_core/widgets/empty_state.dart';
import 'package:flutter_core/widgets/loading_indicator.dart';
import 'package:flutter_core/widgets/project_card.dart';
import 'package:flutter_core/state/providers.dart';

/// 移动端项目列表页（简化版）：项目卡片列表 + 下拉刷新
class ProjectsScreen extends ConsumerStatefulWidget {
  const ProjectsScreen({super.key});

  @override
  ConsumerState<ProjectsScreen> createState() => _ProjectsScreenState();
}

class _ProjectsScreenState extends ConsumerState<ProjectsScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(projectListNotifierProvider.notifier).refresh());
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(projectListNotifierProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('我的项目')),
      body: RefreshIndicator(
        onRefresh: () => ref.read(projectListNotifierProvider.notifier).refresh(),
        child: state.isLoading && state.items.isEmpty
            ? const LoadingIndicator()
            : state.items.isEmpty
                ? const EmptyState(
                    icon: Icons.folder_open,
                    title: '还没有项目',
                    message: '在桌面端创建项目后可在此查看',
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: state.items.length,
                    itemBuilder: (context, index) {
                      final project = state.items[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: ProjectCard(
                          project: project,
                          onTap: () => context.go('/projects/${project.id}'),
                        ),
                      );
                    },
                  ),
      ),
    );
  }
}
