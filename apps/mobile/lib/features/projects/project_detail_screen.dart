// ignore_for_file: directives_ordering

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:flutter_core/models/product_type.dart';
import 'package:flutter_core/widgets/error_view.dart';
import 'package:flutter_core/widgets/loading_indicator.dart';
import 'package:flutter_core/widgets/status_badge.dart';
import 'package:flutter_core/state/providers.dart';

/// 移动端项目详情页
///
/// - 状态卡片
/// - 配置预览（简化）
/// - "对话式修改" 入口（跳转 QuickEditScreen）
/// - "分享" 按钮（生成二维码）
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
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: state.project != null
                ? () => _showQr(context, state.project!.id)
                : null,
            tooltip: '分享',
          ),
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

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // 状态卡片
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: (meta?.themeColor ?? Theme.of(context).colorScheme.primary)
                        .withOpacity(0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(meta?.iconData ?? Icons.widgets,
                      color: meta?.themeColor, size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(project.name,
                          style: Theme.of(context).textTheme.titleMedium),
                      Text(meta?.name ?? project.type.name,
                          style: Theme.of(context).textTheme.bodySmall),
                    ],
                  ),
                ),
                StatusBadge(status: project.status.name),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        // 配置预览（简化）
        Text('配置预览', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Text(
              project.config.isEmpty
                  ? '（暂无配置）'
                  : '共 ${project.config.length} 个配置项',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
        ),
        const SizedBox(height: 16),
        // 对话式修改入口
        Card(
          child: ListTile(
            leading: const Icon(Icons.chat),
            title: const Text('对话式修改'),
            subtitle: const Text('用自然语言描述需求，AI 帮你改'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.go('/projects/$projectId/quick-edit'),
          ),
        ),
        const SizedBox(height: 12),
        // 部署 URL
        if (project.deployUrl != null)
          Card(
            child: ListTile(
              leading: const Icon(Icons.link),
              title: const Text('访问地址'),
              subtitle: Text(project.deployUrl!),
              trailing: const Icon(Icons.open_in_new),
            ),
          ),
      ],
    );
  }

  void _showQr(BuildContext context, String projectId) {
    // TODO(week1): 生成项目二维码（依赖 qr_flutter 等包）
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('分享项目'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.qr_code, size: 120),
            const SizedBox(height: 12),
            Text('projectId: $projectId',
                style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('关闭'),
          ),
        ],
      ),
    );
  }
}
