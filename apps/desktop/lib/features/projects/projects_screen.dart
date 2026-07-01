// ignore_for_file: directives_ordering

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:flutter_core/widgets/empty_state.dart';
import 'package:flutter_core/widgets/loading_indicator.dart';
import 'package:flutter_core/widgets/project_card.dart';
import 'package:flutter_core/state/providers.dart';

/// 项目列表页：项目网格 + 新建项目按钮
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
      body: RefreshIndicator(
        onRefresh: () => ref.read(projectListNotifierProvider.notifier).refresh(),
        child: state.isLoading && state.items.isEmpty
            ? const LoadingIndicator()
            : state.items.isEmpty
                ? EmptyState(
                    icon: Icons.folder_open,
                    title: '还没有项目',
                    message: '创建你的第一个 AI 产品项目',
                    actionLabel: '新建项目',
                    onAction: () => context.go('/projects/new'),
                  )
                : GridView.builder(
                    padding: const EdgeInsets.all(24),
                    gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                      maxCrossAxisExtent: 360,
                      childAspectRatio: 1.4,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                    ),
                    itemCount: state.items.length,
                    itemBuilder: (context, index) {
                      final project = state.items[index];
                      return ProjectCard(
                        project: project,
                        onTap: () => context.go('/projects/${project.id}'),
                      );
                    },
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
