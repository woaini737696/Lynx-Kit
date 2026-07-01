// ignore_for_file: directives_ordering

import 'package:flutter/foundation.dart';

import 'api_client.dart';
import 'package:flutter_core/models/server.dart';
import 'package:flutter_core/utils/constants.dart';

/// 服务器服务（对应后端 server.list / server.get / server.create 等端点）
class ServerService {
  ServerService({ApiClient? apiClient}) : _api = apiClient ?? ApiClient.instance;

  final ApiClient _api;

  /// 服务器列表
  Future<List<Server>> list() async {
    final response = await _api.get<Map<String, dynamic>>(
      '${AppConstants.trpcPrefix}/server.list',
    );
    final data = response.data!;
    final items = (data['items'] as List<dynamic>? ?? <dynamic>[])
        .map((e) => Server.fromJson(e as Map<String, dynamic>))
        .toList();
    return items;
  }

  /// 获取服务器详情
  Future<Server> get(String id) async {
    final response = await _api.get<Map<String, dynamic>>(
      '${AppConstants.trpcPrefix}/server.get',
      queryParameters: <String, dynamic>{'id': id},
    );
    return Server.fromJson(response.data!);
  }

  /// 创建服务器（密码将经后端 AES-256-GCM 加密存储）
  Future<Server> create(CreateServerInput input) async {
    final response = await _api.post<Map<String, dynamic>>(
      '${AppConstants.trpcPrefix}/server.create',
      data: input.toJson(),
    );
    return Server.fromJson(response.data!);
  }

  /// 删除服务器
  Future<void> delete(String id) async {
    await _api.delete<Map<String, dynamic>>(
      '${AppConstants.trpcPrefix}/server.delete',
      queryParameters: <String, dynamic>{'id': id},
    );
    debugPrint('[ServerService] 已删除服务器 $id');
  }

  /// 测试 SSH 连接（不保存，仅返回探测信息）
  Future<TestConnectionResponse> testConnection(TestConnectionInput input) async {
    final response = await _api.post<Map<String, dynamic>>(
      '${AppConstants.trpcPrefix}/server.testConnection',
      data: input.toJson(),
    );
    return TestConnectionResponse.fromJson(response.data!);
  }
}
