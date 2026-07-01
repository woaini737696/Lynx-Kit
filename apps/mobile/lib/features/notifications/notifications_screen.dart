// ignore_for_file: directives_ordering

import 'package:flutter/material.dart';

import 'package:flutter_core/theme/app_colors.dart';
import 'package:flutter_core/widgets/status_badge.dart';

/// 通知列表页：部署通知卡片列表 + 已读/未读状态
class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('通知'),
        actions: [
          IconButton(
            icon: const Icon(Icons.done_all),
            tooltip: '全部已读',
            onPressed: () {
              // TODO(week1): 标记全部已读
            },
          ),
        ],
      ),
      body: _notifications.isEmpty
          ? const Center(child: Text('暂无通知'))
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: _notifications.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final n = _notifications[index];
                return ListTile(
                  leading: CircleAvatar(
                    backgroundColor: AppColors.primary.withOpacity(0.12),
                    child: Icon(n.icon, color: AppColors.primary),
                  ),
                  title: Row(
                    children: [
                      Expanded(child: Text(n.title)),
                      if (!n.read)
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: AppColors.primary,
                            shape: BoxShape.circle,
                          ),
                        ),
                    ],
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 4),
                      Text(n.message),
                      const SizedBox(height: 4),
                      StatusBadge(status: n.status),
                    ],
                  ),
                  onTap: () {
                    // TODO(week1): 跳转对应项目详情
                  },
                );
              },
            ),
    );
  }
}

class _NotificationItem {
  const _NotificationItem({
    required this.title,
    required this.message,
    required this.status,
    required this.icon,
    required this.read,
  });
  final String title;
  final String message;
  final String status;
  final IconData icon;
  final bool read;
}

// 占位数据
const _notifications = <_NotificationItem>[
  _NotificationItem(
    title: '部署成功',
    message: '项目「个人官网」已成功部署',
    status: 'success',
    icon: Icons.cloud_done,
    read: false,
  ),
  _NotificationItem(
    title: '部署失败',
    message: '项目「电商商城」部署失败，请查看日志',
    status: 'failed',
    icon: Icons.error,
    read: false,
  ),
  _NotificationItem(
    title: '代码生成完成',
    message: '项目「预约系统」代码已生成',
    status: 'deployed',
    icon: Icons.code,
    read: true,
  ),
];
