// ignore_for_file: directives_ordering

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:flutter_core/widgets/empty_state.dart';
import 'package:flutter_core/widgets/loading_indicator.dart';
import 'package:flutter_core/widgets/server_card.dart';
import 'package:flutter_core/state/providers.dart';

/// 服务器列表页
class ServersScreen extends ConsumerStatefulWidget {
  const ServersScreen({super.key});

  @override
  ConsumerState<ServersScreen> createState() => _ServersScreenState();
}

class _ServersScreenState extends ConsumerState<ServersScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(serverListNotifierProvider.notifier).refresh());
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(serverListNotifierProvider);

    return Scaffold(
      body: state.isLoading && state.items.isEmpty
          ? const LoadingIndicator()
          : state.items.isEmpty
              ? EmptyState(
                  icon: Icons.dns_outlined,
                  title: '还没有服务器',
                  message: '添加你的第一台 SSH 服务器以开始部署',
                  actionLabel: '添加服务器',
                  onAction: () => context.go('/servers/new'),
                )
              : RefreshIndicator(
                  onRefresh: () =>
                      ref.read(serverListNotifierProvider.notifier).refresh(),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(24),
                    itemCount: state.items.length,
                    itemBuilder: (context, index) {
                      final server = state.items[index];
                      return ServerCard(
                        server: server,
                        onTap: () {
                          // TODO(week1): 跳转服务器详情
                        },
                      );
                    },
                  ),
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.go('/servers/new'),
        icon: const Icon(Icons.add),
        label: const Text('添加服务器'),
      ),
    );
  }
}
