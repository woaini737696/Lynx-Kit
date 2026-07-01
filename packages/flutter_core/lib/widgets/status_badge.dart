// ignore_for_file: directives_ordering

import 'package:flutter/material.dart';

import 'package:flutter_core/theme/app_colors.dart';

/// 状态徽章 widget：根据状态字符串显示不同颜色徽章
///
/// 支持项目状态（draft/deployed/error 等）与服务器状态（pending/connected 等）。
class StatusBadge extends StatelessWidget {
  const StatusBadge({
    super.key,
    required this.status,
    this.label,
    this.useProjectColor = true,
  });

  /// 状态原始字符串
  final String status;

  /// 显示文本（默认即 status）
  final String? label;

  /// 是否使用项目状态色映射（false 则用服务器状态色映射）
  final bool useProjectColor;

  @override
  Widget build(BuildContext context) {
    final color = useProjectColor
        ? AppColors.projectStatusColor(status)
        : AppColors.serverStatusColor(status);
    final text = label ?? _humanize(status);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 6),
          Text(
            text,
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  /// 将 snake_case 状态转为可读中文/驼峰
  String _humanize(String s) {
    const map = <String, String>{
      'draft': '草稿',
      'clarifying': '澄清中',
      'generating': '生成中',
      'building': '构建中',
      'deploying': '部署中',
      'deployed': '已部署',
      'error': '错误',
      'pending': '待验证',
      'connected': '已连接',
      'docker_ready': 'Docker 就绪',
      'caddy_ready': 'Caddy 就绪',
      'success': '成功',
      'failed': '失败',
    };
    return map[s] ?? s.replaceAll('_', ' ');
  }
}
