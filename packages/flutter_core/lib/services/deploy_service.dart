// ignore_for_file: directives_ordering

import 'package:flutter/foundation.dart';

import 'api_client.dart';
import 'package:flutter_core/utils/constants.dart';

/// 部署任务状态枚举（对应 shared/types/deploy.ts DeployJobStatus）
enum DeployJobStatus {
  queued,
  uploading,
  building,
  starting,
  configuring,
  healthChecking,
  completed,
  failed,
}

/// 部署日志状态（pending / success / failed）对应 DeployStatus
enum DeployStatus { pending, success, failed }

/// 部署任务状态（对应 shared/types/deploy.ts DeployProgressEvent）
class DeployJobStatusInfo {
  const DeployJobStatusInfo({
    required this.jobId,
    required this.status,
    required this.progress,
    required this.message,
    required this.timestamp,
  });

  final String jobId;
  final DeployJobStatus status;
  final double progress;
  final String message;
  final DateTime timestamp;

  factory DeployJobStatusInfo.fromJson(Map<String, dynamic> json) {
    final raw = json['status'] as String? ?? 'queued';
    return DeployJobStatusInfo(
      jobId: json['jobId'] as String,
      status: _parseJobStatus(raw),
      progress: (json['progress'] as num?)?.toDouble() ?? 0,
      message: json['message'] as String? ?? '',
      timestamp: DateTime.parse(json['timestamp'] as String),
    );
  }
}

/// 将后端 snake_case 状态字符串解析为枚举
DeployJobStatus _parseJobStatus(String raw) {
  switch (raw) {
    case 'queued':
      return DeployJobStatus.queued;
    case 'uploading':
      return DeployJobStatus.uploading;
    case 'building':
      return DeployJobStatus.building;
    case 'starting':
      return DeployJobStatus.starting;
    case 'configuring':
      return DeployJobStatus.configuring;
    case 'health_checking':
      return DeployJobStatus.healthChecking;
    case 'completed':
      return DeployJobStatus.completed;
    case 'failed':
      return DeployJobStatus.failed;
    default:
      return DeployJobStatus.queued;
  }
}

/// 部署日志（对应 shared/types/deploy.ts DeployLog）
class DeployLog {
  const DeployLog({
    required this.id,
    required this.projectId,
    required this.status,
    required this.logs,
    this.duration,
    this.error,
    required this.createdAt,
  });

  final String id;
  final String projectId;
  final String status; // pending / success / failed
  final String logs;
  final int? duration;
  final String? error;
  final DateTime createdAt;

  factory DeployLog.fromJson(Map<String, dynamic> json) {
    return DeployLog(
      id: json['id'] as String,
      projectId: json['projectId'] as String,
      status: json['status'] as String? ?? 'pending',
      logs: json['logs'] as String? ?? '',
      duration: (json['duration'] as num?)?.toInt(),
      error: json['error'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}

/// 部署服务（对应后端 deploy.trigger / deploy.status / deploy.logs 端点）
class DeployService {
  DeployService({ApiClient? apiClient}) : _api = apiClient ?? ApiClient.instance;

  final ApiClient _api;

  /// 触发部署
  ///
  /// [regenerate] 是否强制重新生成代码。
  /// 返回 jobId。
  Future<String> trigger(String projectId, {bool regenerate = false}) async {
    final response = await _api.post<Map<String, dynamic>>(
      '${AppConstants.trpcPrefix}/deploy.trigger',
      data: <String, dynamic>{
        'projectId': projectId,
        'regenerate': regenerate,
      },
    );
    final data = response.data!;
    final jobId = data['jobId'] as String? ?? data['id'] as String?;
    if (jobId == null) {
      throw StateError('deploy.trigger 未返回 jobId');
    }
    debugPrint('[DeployService] 触发部署 projectId=$projectId jobId=$jobId');
    return jobId;
  }

  /// 查询部署任务状态
  Future<DeployJobStatusInfo> getStatus(String jobId) async {
    final response = await _api.get<Map<String, dynamic>>(
      '${AppConstants.trpcPrefix}/deploy.status',
      queryParameters: <String, dynamic>{'jobId': jobId},
    );
    return DeployJobStatusInfo.fromJson(response.data!);
  }

  /// 获取项目部署日志列表
  Future<List<DeployLog>> getLogs(String projectId) async {
    final response = await _api.get<Map<String, dynamic>>(
      '${AppConstants.trpcPrefix}/deploy.logs',
      queryParameters: <String, dynamic>{'projectId': projectId},
    );
    final data = response.data!;
    final items = (data['items'] as List<dynamic>? ?? <dynamic>[])
        .map((e) => DeployLog.fromJson(e as Map<String, dynamic>))
        .toList();
    return items;
  }
}
