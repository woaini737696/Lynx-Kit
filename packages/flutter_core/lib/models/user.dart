// ignore_for_file: directives_ordering

import 'package:freezed_annotation/freezed_annotation.dart';

part 'user.freezed.dart';
part 'user.g.dart';

/// 用户角色枚举（对应 shared/types/user.ts UserRole）
enum UserRole {
  @JsonValue('user')
  user,
  @JsonValue('admin')
  admin,
  @JsonValue('super_admin')
  superAdmin,
}

/// 用户状态枚举（对应 shared/types/user.ts UserStatus）
enum UserStatus {
  @JsonValue('active')
  active,
  @JsonValue('suspended')
  suspended,
  @JsonValue('deleted')
  deleted,
}

/// 平台用户模型（对应 shared/types/user.ts User）
///
/// Week 1 先手写，不依赖 OpenAPI 自动生成。
@freezed
class User with _$User {
  const factory User({
    required String id,
    required String email,
    String? name,
    String? avatar,
    String? phone,
    String? lynxAiId,
    @Default(UserRole.user) UserRole role,
    @Default(UserStatus.active) UserStatus status,
    String? deviceToken,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _User;

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
}
