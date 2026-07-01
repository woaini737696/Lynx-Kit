// ignore_for_file: directives_ordering

import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:flutter_core/models/product_type.dart';
import 'package:flutter_core/widgets/error_view.dart';
import 'package:flutter_core/widgets/loading_indicator.dart';
import 'package:flutter_core/widgets/status_badge.dart';
import 'package:flutter_core/state/providers.dart';

/// 项目详情页：基本信息 + 配置预览 + 部署历史 + 操作按钮
class ProjectDetailScreen extends ConsumerWidget {
  const ProjectDetailScreen({super.key, required this.projectId});

  final String projectId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(projectDetailNotifierProvider(projectId));

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/projects'),
        ),
        title: Text(state.project?.name ?? '项目详情'),
        actions: [
          if (state.project != null) ...[
            IconButton(
              icon: const Icon(Icons.play_arrow),
              tooltip: '重新部署',
              onPressed: () => _triggerDeploy(context, ref),
            ),
            IconButton(
              icon: const Icon(Icons.article_outlined),
              tooltip: '查看日志',
              onPressed: () => context.go('/deploy/$projectId/logs'),
            ),
          ],
        ],
      ),
      body: state.isLoading
          ? const LoadingIndicator()
          : state.error != null
              ? ErrorView(message: state.error!, onRetry: () {
                  ref.read(projectDetailNotifierProvider(projectId).notifier).refresh();
                })
              : state.project == null
                  ? const LoadingIndicator()
                  : _buildContent(context, ref, state.project!),
    );
  }

  Widget _buildContent(BuildContext context, WidgetRef ref, project) {
    final meta = getProductTypeMeta(project.type);
    final configJson = const JsonEncoder.withIndent('  ').convert(project.config);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 基本信息
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: (meta?.themeColor ?? Theme.of(context).colorScheme.primary)
                          .withOpacity(0.12),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(meta?.iconData ?? Icons.widgets,
                        color: meta?.themeColor, size: 28),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(project.name,
                            style: Theme.of(context).textTheme.headlineSmall),
                        const SizedBox(height: 4),
                        Text(meta?.name ?? project.type.name,
                            style: Theme.of(context).textTheme.bodyMedium),
                      ],
                    ),
                  ),
                  StatusBadge(status: project.status.name),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          // 当前配置 JSON 预览
          Text('当前配置', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          Card(
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).brightness == Brightness.dark
                    ? const Color(0xFF0D1117)
                    : const Color(0xFFF6F8FA),
                borderRadius: BorderRadius.circular(12),
              ),
              child: SelectableText(
                configJson,
                style: const TextStyle(
                  fontFamily: 'monospace',
                  fontSize: 13,
                  height: 1.5,
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),
          // 部署历史（占位）
          Text('部署历史', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          Card(
            child: ListTile(
              leading: const Icon(Icons.history, color: Colors.grey),
              title: const Text('暂无部署记录'),
              subtitle: const Text('点击右上角播放按钮触发首次部署'),
            ),
          ),
          const SizedBox(height: 24),
          // 操作按钮
          Row(
            children: [
              OutlinedButton.icon(
                onPressed: () {
                  // TODO(week1): 打开配置编辑器（re_editor）
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('配置编辑器待实现')),
                  );
                },
                icon: const Icon(Icons.edit),
                label: const Text('编辑配置'),
              ),
              const SizedBox(width: 12),
              ElevatedButton.icon(
                onPressed: () => _triggerDeploy(context, ref),
                icon: const Icon(Icons.rocket_launch),
                label: const Text('重新部署'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _triggerDeploy(BuildContext context, WidgetRef ref) async {
    try {
      final jobId = await ref.read(deployServiceProvider).trigger(projectId);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('部署已触发 jobId=$jobId')),
        );
        context.go('/deploy/$projectId/logs');
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('触发部署失败：$e'), backgroundColor: Colors.red),
        );
      }
    }
  }
}
