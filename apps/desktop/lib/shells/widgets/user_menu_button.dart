// ignore_for_file: directives_ordering

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:flutter_core/models/user.dart';
import 'package:flutter_core/state/providers.dart';

/// 用户菜单按钮（点击下拉显示用户信息 + 退出）
class UserMenuButton extends ConsumerWidget {
  const UserMenuButton({super.key, this.user});

  final User? user;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (user == null) {
      return const SizedBox.shrink();
    }
    return PopupMenuButton<String>(
      offset: const Offset(0, 48),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          CircleAvatar(
            radius: 16,
            backgroundColor: Theme.of(context).colorScheme.primary.withOpacity(0.12),
            child: Text(
              (user!.name?.isNotEmpty == true ? user!.name : user!.email)[0].toUpperCase(),
              style: TextStyle(color: Theme.of(context).colorScheme.primary),
            ),
          ),
          const SizedBox(width: 8),
          Text(user!.name ?? user!.email, style: Theme.of(context).textTheme.bodyMedium),
          const Icon(Icons.arrow_drop_down),
        ],
      ),
      itemBuilder: (context) => <PopupMenuEntry<String>>[
        PopupMenuItem<String>(
          enabled: false,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(user!.name ?? '未设置昵称', style: Theme.of(context).textTheme.titleSmall),
              Text(user!.email, style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
        ),
        const PopupMenuDivider(),
        const PopupMenuItem<String>(value: 'settings', child: Text('设置')),
        const PopupMenuItem<String>(value: 'logout', child: Text('退出登录')),
      ],
      onSelected: (value) async {
        switch (value) {
          case 'settings':
            context.go('/settings');
          case 'logout':
            await ref.read(authNotifierProvider.notifier).logout();
            context.go('/login');
        }
      },
    );
  }
}
