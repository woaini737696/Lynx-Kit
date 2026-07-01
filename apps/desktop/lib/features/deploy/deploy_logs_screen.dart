// ignore_for_file: directives_ordering

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:flutter_core/widgets/loading_indicator.dart';
import 'package:flutter_core/widgets/status_badge.dart';
import 'package:flutter_core/services/deploy_service.dart';
import 'package:flutter_core/state/providers.dart';

/// 部署日志页：实时日志流（占位） + 部署状态徽章 + 进度条
class DeployLogsScreen extends ConsumerStatefulWidget {
  const DeployLogsScreen({super.key, required this.projectId});

  final String projectId;

  @override
  ConsumerState<DeployLogsScreen> createState() => _DeployLogsScreenState();
}

class _DeployLogsScreenState extends ConsumerState<DeployLogsScreen> {
  String? _jobId;
  DeployJobStatusInfo? _status;
  List<DeployLog> _logs = <DeployLog>[];
  bool _loading = true;
  final _scrollCtrl = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadLogs();
  }

  Future<void> _loadLogs() async {
    setState(() => _loading = true);
    try {
      final logs = await ref.read(deployServiceProvider).getLogs(widget.projectId);
      setState(() => _logs = logs);
    } catch (_) {
      // 忽略错误
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _triggerDeploy() async {
    try {
      final jobId = await ref.read(deployServiceProvider).trigger(widget.projectId);
      setState(() => _jobId = jobId);
      _toast('部署已触发');
      _loadLogs();
    } catch (e) {
      _toast('触发失败：$e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/projects/${widget.projectId}'),
        ),
        title: const Text('部署日志'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadLogs,
            tooltip: '刷新',
          ),
          IconButton(
            icon: const Icon(Icons.play_arrow),
            onPressed: _triggerDeploy,
            tooltip: '重新部署',
          ),
        ],
      ),
      body: _loading
          ? const LoadingIndicator()
          : Column(
              children: [
                // 状态徽章 + 进度条
                Container(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          StatusBadge(
                            status: _status?.status.name ?? 'queued',
                          ),
                          const SizedBox(width: 12),
                          if (_jobId != null)
                            Expanded(
                              child: Text(
                                'jobId: $_jobId',
                                style: Theme.of(context).textTheme.bodySmall,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                        ],
                      ),
                      if (_status != null) ...[
                        const SizedBox(height: 12),
                        LinearProgressIndicator(
                          value: _status!.progress / 100,
                          backgroundColor: Theme.of(context).colorScheme.surfaceVariant,
                        ),
                        const SizedBox(height: 8),
                        Text(_status!.message,
                            style: Theme.of(context).textTheme.bodySmall),
                      ],
                    ],
                  ),
                ),
                const Divider(height: 1),
                // 日志流（占位）
                Expanded(
                  child: _logs.isEmpty
                      ? const Center(
                          child: Text('暂无日志，点击右上角播放按钮触发部署'),
                        )
                      : ListView.builder(
                          controller: _scrollCtrl,
                          padding: const EdgeInsets.all(16),
                          itemCount: _logs.length,
                          itemBuilder: (context, index) {
                            final log = _logs[index];
                            return Card(
                              child: ExpansionTile(
                                title: Row(
                                  children: [
                                    StatusBadge(status: log.status),
                                    const SizedBox(width: 12),
                                    Text(log.createdAt.toString()),
                                  ],
                                ),
                                children: [
                                  Container(
                                    width: double.infinity,
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: Theme.of(context).brightness == Brightness.dark
                                          ? const Color(0xFF0D1117)
                                          : const Color(0xFFF6F8FA),
                                    ),
                                    child: SelectableText(
                                      log.logs.isEmpty ? '(无日志)' : log.logs,
                                      style: const TextStyle(
                                        fontFamily: 'monospace',
                                        fontSize: 12,
                                        height: 1.5,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
    );
  }

  void _toast(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }
}
