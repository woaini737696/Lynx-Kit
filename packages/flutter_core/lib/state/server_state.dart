// ignore_for_file: directives_ordering

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:flutter_core/models/server.dart';
import 'package:flutter_core/services/server_service.dart';
import 'providers.dart';

/// 服务器列表状态
class ServerListState {
  const ServerListState({
    this.items = const <Server>[],
    this.isLoading = false,
    this.error,
  });

  final List<Server> items;
  final bool isLoading;
  final String? error;

  ServerListState copyWith({
    List<Server>? items,
    bool? isLoading,
    String? error,
  }) {
    return ServerListState(
      items: items ?? this.items,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

/// 服务器列表 Notifier
class ServerListNotifier extends StateNotifier<ServerListState> {
  ServerListNotifier(this._service) : super(const ServerListState());

  final ServerService _service;

  /// 拉取服务器列表
  Future<void> refresh() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final items = await _service.list();
      state = ServerListState(items: items);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  /// 创建服务器
  Future<Server> create(CreateServerInput input) async {
    final server = await _service.create(input);
    state = state.copyWith(items: <Server>[server, ...state.items]);
    return server;
  }

  /// 删除服务器
  Future<void> delete(String id) async {
    await _service.delete(id);
    state = state.copyWith(
      items: state.items.where((s) => s.id != id).toList(),
    );
  }
}
