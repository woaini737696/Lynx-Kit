// ignore_for_file: directives_ordering

import 'package:freezed_annotation/freezed_annotation.dart';

part 'project.freezed.dart';
part 'project.g.dart';

/// 产品类型枚举（对应 shared/types/project.ts ProjectType）
enum ProjectType {
  @JsonValue('static-site')
  staticSite,
  @JsonValue('service-booking')
  serviceBooking,
  @JsonValue('content-publish')
  contentPublish,
  @JsonValue('light-commerce')
  lightCommerce,
  @JsonValue('event-manage')
  eventManage,
  @JsonValue('admin-dashboard')
  adminDashboard,
}

/// 项目状态枚举（对应 shared/types/project.ts ProjectStatus）
enum ProjectStatus {
  /// 草稿（刚创建）
  @JsonValue('draft')
  draft,
  /// 需求澄清中
  @JsonValue('clarifying')
  clarifying,
  /// 代码生成中
  @JsonValue('generating')
  generating,
  /// 编译中
  @JsonValue('building')
  building,
  /// 部署中
  @JsonValue('deploying')
  deploying,
  /// 已部署
  @JsonValue('deployed')
  deployed,
  /// 错误
  @JsonValue('error')
  error,
}

/// 用户产品项目模型（对应 shared/types/project.ts Project）
@freezed
class Project with _$Project {
  const factory Project({
    required String id,
    required String userId,
    required String serverId,
    required String name,
    required ProjectType type,
    @Default(<String, dynamic>{}) Map<String, dynamic> config,
    @Default(ProjectStatus.draft) ProjectStatus status,
    String? domain,
    String? customDomain,
    @Default(1) int version,
    String? deployUrl,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _Project;

  factory Project.fromJson(Map<String, dynamic> json) =>
      _$ProjectFromJson(json);
}

/// 创建项目输入（对应 shared/types/project.ts CreateProjectInput）
@freezed
class CreateProjectInput with _$CreateProjectInput {
  const factory CreateProjectInput({
    required String name,
    required ProjectType type,
    required String serverId,
  }) = _CreateProjectInput;

  factory CreateProjectInput.fromJson(Map<String, dynamic> json) =>
      _$CreateProjectInputFromJson(json);
}

/// 更新项目配置输入（对应 shared/types/project.ts UpdateProjectConfigInput）
@freezed
class UpdateProjectConfigInput with _$UpdateProjectConfigInput {
  const factory UpdateProjectConfigInput({
    required Map<String, dynamic> config,
  }) = _UpdateProjectConfigInput;

  factory UpdateProjectConfigInput.fromJson(Map<String, dynamic> json) =>
      _$UpdateProjectConfigInputFromJson(json);
}

/// 项目版本模型（对应 shared/types/project.ts ProjectVersion）
@freezed
class ProjectVersion with _$ProjectVersion {
  const factory ProjectVersion({
    required String id,
    required String projectId,
    required int version,
    required Map<String, dynamic> config,
    required String codeHash,
    required DateTime createdAt,
  }) = _ProjectVersion;

  factory ProjectVersion.fromJson(Map<String, dynamic> json) =>
      _$ProjectVersionFromJson(json);
}
