// ignore_for_file: directives_ordering

import 'api_client.dart';
import 'package:flutter_core/models/project.dart';
import 'package:flutter_core/models/template.dart';
import 'package:flutter_core/utils/constants.dart';

/// 模板服务（对应后端 template.list / template.get 端点）
class TemplateService {
  TemplateService({ApiClient? apiClient}) : _api = apiClient ?? ApiClient.instance;

  final ApiClient _api;

  /// 模板列表（按产品类型聚合的列表项）
  Future<List<TemplateListItem>> list() async {
    final response = await _api.get<Map<String, dynamic>>(
      '${AppConstants.trpcPrefix}/template.list',
    );
    final data = response.data!;
    final items = (data['items'] as List<dynamic>? ?? <dynamic>[])
        .map((e) => TemplateListItem.fromJson(e as Map<String, dynamic>))
        .toList();
    return items;
  }

  /// 根据产品类型获取模板详情（含问题清单）
  Future<Template> get(ProjectType type) async {
    final response = await _api.get<Map<String, dynamic>>(
      '${AppConstants.trpcPrefix}/template.get',
      queryParameters: <String, dynamic>{'type': type.name},
    );
    return Template.fromJson(response.data!);
  }
}
