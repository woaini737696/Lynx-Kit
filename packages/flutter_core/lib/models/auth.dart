// ignore_for_file: directives_ordering

import 'package:freezed_annotation/freezed_annotation.dart';

import 'user.dart';

part 'auth.freezed.dart';
part 'auth.g.dart';

/// 登录请求（对应 shared/types/user.ts LoginInput）
@freezed
class LoginRequest with _$LoginRequest {
  const factory LoginRequest({
    required String email,
    required String password,
  }) = _LoginRequest;

  factory LoginRequest.fromJson(Map<String, dynamic> json) =>
      _$LoginRequestFromJson(json);
}

/// 登录响应（对应 shared/types/user.ts LoginResponse，含 JWT）
@freezed
class LoginResponse with _$LoginResponse {
  const factory LoginResponse({
    required User user,
    required String token,
    required int expiresIn,
  }) = _LoginResponse;

  factory LoginResponse.fromJson(Map<String, dynamic> json) =>
      _$LoginResponseFromJson(json);
}

/// 注册请求（对应 shared/types/user.ts CreateUserInput）
@freezed
class RegisterRequest with _$RegisterRequest {
  const factory RegisterRequest({
    required String email,
    required String password,
    String? name,
  }) = _RegisterRequest;

  factory RegisterRequest.fromJson(Map<String, dynamic> json) =>
      _$RegisterRequestFromJson(json);
}
