// ignore_for_file: directives_ordering

import 'package:flutter/material.dart';

import 'package:flutter_core/models/server.dart';
import 'package:flutter_core/theme/app_colors.dart';
import 'status_badge.dart';

/// 服务器卡片 widget：展示名称/IP/状态/系统信息
class ServerCard extends StatelessWidget {
  const ServerCard({
    super.key,
    required this.server,
    this.onTap,
  });

  final Server server;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppColors.info.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.dns, color: AppColors.info, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          server.name,
                          style: theme.textTheme.titleMedium,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          '${server.ip}:${server.port}',
                          style: theme.textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  StatusBadge(status: server.status.name, useProjectColor: false),
                ],
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  if (server.osInfo != null)
                    _InfoChip(icon: Icons.computer, label: server.osInfo!),
                  if (server.cpuCores != null)
                    _InfoChip(icon: Icons.memory, label: '${server.cpuCores} 核'),
                  if (server.memoryMB != null)
                    _InfoChip(icon: Icons.developer_board, label: '${_gb(server.memoryMB!)}GB'),
                  if (server.diskGB != null)
                    _InfoChip(icon: Icons.storage, label: '${server.diskGB}GB'),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  static int _gb(int mb) => (mb / 1024).round();
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: theme.textTheme.bodySmall?.color),
        const SizedBox(width: 4),
        Text(label, style: theme.textTheme.bodySmall),
      ],
    );
  }
}
