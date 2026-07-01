// ignore_for_file: directives_ordering

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import 'api_client.dart';
import 'package:flutter_core/models/project.dart';
import 'package:flutter_core/utils/constants.dart';

/// 分页列表结果
class PagedResult<T> {
  const PagedResult({required this.items, this.total = 0, this.page = 1, this.pageSize = 20});

  final List<T> items;
  final int total;
  final int page;
  final int pageSize;

  bool get hasMore => items.length < total;
}

/// 项目服务（对应后端 project.list / project.get / project.create 等端点）
class ProjectService {
  ProjectService({ApiClient? apiClient}) : _api = apiClient ?? ApiClient.instance;

  final ApiClient _api;

  /// 项目列表（分页）
  Future<PagedResult<Project>> list({
    int page = 1,
    int pageSize = 20,
  }) async {
    final response = await _api.get<Map<String, dynamic>>(
      '${AppConstants.trpcPrefix}/project.list',
      queryParameters: <String, dynamic>{
        'page': page,
        'pageSize': pageSize,
      },
    );
    final data = response.data!;
    final items = (data['items'] as List<dynamic>? ?? <dynamic>[])
        .map((e) => Project.fromJson(e as Map<String, dynamic>))
        .toList();
    return PagedResult<Project>(
      items: items,
      total: (data['total'] as num?)?.toInt() ?? items.length,
      page: (data['page'] as num?)?.toInt() ?? page,
      pageSize: (data['pageSize'] as num?)?.toInt() ?? pageSize,
    );
  }

  /// 获取项目详情
  Future<Project> get(String id) async {
    final response = await _api.get<Map<String, dynamic>>(
      '${AppConstants.trpcPrefix}/project.get',
      queryParameters: <String, dynamic>{'id': id},
    );
    return Project.fromJson(response.data!);
  }

  /// 创建项目
  Future<Project> create(String name, ProjectType type, String serverId) async {
    final response = await _api.post<Map<String, dynamic>>(
      '${AppConstants.trpcPrefix}/project.create',
      data: CreateProjectInput(name: name, type: type, serverId: serverId).toJson(),
    );
    return Project.fromJson(response.data!);
  }

  /// 更新项目配置
  Future<Project> updateConfig(String id, Map<String, dynamic> config) async {
    final response = await _api.put<Map<String, dynamic>>(
      '${AppConstants.trpcPrefix}/project.updateConfig',
      queryParameters: <String, dynamic>{'id': id},
      data: UpdateProjectConfigInput(config: config).toJson(),
    );
    return Project.fromJson(response.data!);
  }

  /// 删除项目
  Future<void> delete(String id) async {
    await _api.delete<Map<String, dynamic>>(
      '${AppConstants.trpcPrefix}/project.delete',
      queryParameters: <String, dynamic>{'id': id},
    );
    debugPrint('[ProjectService] 已删除项目 $id');
  }

  /// 项目版本列表（用于回滚）
  Future<List<ProjectVersion>> listVersions(String id) async {
    final response = await _api.get<Map<String, dynamic>>(
      '${AppConstants.trpcPrefix}/project.listVersions',
      queryParameters: <String, dynamic>{'id': id},
    );
    final data = response.data!;
    final items = (data['items'] as List<dynamic>? ?? data['versions'] as List<dynamic>? ?? <dynamic>[])
        .map((e) => ProjectVersion.fromJson(e as Map<String, dynamic>))
        .toList();
    return items;
  }
}
