// ignore_for_file: directives_ordering

import 'package:freezed_annotation/freezed_annotation.dart';

part 'server.freezed.dart';
part 'server.g.dart';

/// 服务器状态枚举（对应 shared/types/server.ts ServerStatus）
enum ServerStatus {
  /// 待验证（刚添加，未测试连接）
  @JsonValue('pending')
  pending,
  /// 已连接（SSH 测试通过）
  @JsonValue('connected')
  connected,
  /// Docker 已就绪
  @JsonValue('docker_ready')
  dockerReady,
  /// Caddy 已就绪
  @JsonValue('caddy_ready')
  caddyReady,
  /// 连接异常
  @JsonValue('error')
  error,
}

/// 用户服务器模型（对应 shared/types/server.ts Server）
///
/// 出于安全考虑，本模型不包含加密后的 password 字段。
@freezed
class Server with _$Server {
  const factory Server({
    required String id,
    required String userId,
    required String name,
    required String ip,
    @Default(22) int port,
    required String username,
    @Default(ServerStatus.pending) ServerStatus status,
    @Default(false) bool dockerReady,
    @Default(false) bool caddyReady,
    String? osInfo,
    int? cpuCores,
    int? memoryMB,
    int? diskGB,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _Server;

  factory Server.fromJson(Map<String, dynamic> json) => _$ServerFromJson(json);
}

/// 创建服务器输入（对应 shared/types/server.ts CreateServerInput）
@freezed
class CreateServerInput with _$CreateServerInput {
  const factory CreateServerInput({
    required String name,
    required String ip,
    @Default(22) int port,
    required String username,
    required String password,
    String? sshKey,
  }) = _CreateServerInput;

  factory CreateServerInput.fromJson(Map<String, dynamic> json) =>
      _$CreateServerInputFromJson(json);
}

/// SSH 测试连接请求（对应 shared/types/server.ts TestConnectionInput）
@freezed
class TestConnectionInput with _$TestConnectionInput {
  const factory TestConnectionInput({
    required String ip,
    @Default(22) int port,
    required String username,
    required String password,
  }) = _TestConnectionInput;

  factory TestConnectionInput.fromJson(Map<String, dynamic> json) =>
      _$TestConnectionInputFromJson(json);
}

/// SSH 测试连接响应（对应 shared/types/server.ts TestConnectionResponse）
@freezed
class TestConnectionResponse with _$TestConnectionResponse {
  const factory TestConnectionResponse({
    required bool success,
    required String message,
    String? osInfo,
    @Default(false) bool dockerInstalled,
    String? dockerVersion,
    @Default(false) bool caddyInstalled,
    int? cpuCores,
    int? memoryMB,
    int? diskGB,
  }) = _TestConnectionResponse;

  factory TestConnectionResponse.fromJson(Map<String, dynamic> json) =>
      _$TestConnectionResponseFromJson(json);
}
