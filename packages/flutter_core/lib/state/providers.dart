// ignore_for_file: directives_ordering

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:flutter_core/services/api_client.dart';
import 'package:flutter_core/services/auth_service.dart';
import 'package:flutter_core/services/project_service.dart';
import 'package:flutter_core/services/server_service.dart';
import 'package:flutter_core/services/template_service.dart';
import 'package:flutter_core/services/deploy_service.dart';
import 'auth_state.dart';
import 'project_state.dart';
import 'server_state.dart';

// ===== 服务层 providers =====

/// [ApiClient] 单例 provider（需在 app 启动时调用 ApiClient.init 完成初始化）
final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient.instance;
});

/// [AuthService] provider
final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService();
});

/// [ProjectService] provider
final projectServiceProvider = Provider<ProjectService>((ref) {
  return ProjectService(apiClient: ref.watch(apiClientProvider));
});

/// [ServerService] provider
final serverServiceProvider = Provider<ServerService>((ref) {
  return ServerService(apiClient: ref.watch(apiClientProvider));
});

/// [TemplateService] provider
final templateServiceProvider = Provider<TemplateService>((ref) {
  return TemplateService(apiClient: ref.watch(apiClientProvider));
});

/// [DeployService] provider
final deployServiceProvider = Provider<DeployService>((ref) {
  return DeployService(apiClient: ref.watch(apiClientProvider));
});

// ===== 状态层 providers =====

/// 认证状态 provider
final authNotifierProvider =
    StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.watch(authServiceProvider));
});

/// 项目列表状态 provider
final projectListNotifierProvider =
    StateNotifierProvider<ProjectListNotifier, ProjectListState>((ref) {
  return ProjectListNotifier(ref.watch(projectServiceProvider));
});

/// 项目详情状态 provider（按 projectId 族）
final projectDetailNotifierProvider =
    StateNotifierProviderFamily<ProjectDetailNotifier, ProjectDetailState, String>(
        (ref, projectId) {
  return ProjectDetailNotifier(ref.watch(projectServiceProvider), projectId);
});

/// 服务器列表状态 provider
final serverListNotifierProvider =
    StateNotifierProvider<ServerListNotifier, ServerListState>((ref) {
  return ServerListNotifier(ref.watch(serverServiceProvider));
});
