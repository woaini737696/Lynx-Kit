// ignore_for_file: directives_ordering

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'api_client.dart';
import 'package:flutter_core/models/auth.dart';
import 'package:flutter_core/models/user.dart';
import 'package:flutter_core/utils/constants.dart';

/// 认证服务（对应后端 auth.login / auth.register / auth.me 等 tRPC 端点）
///
/// token 持久化使用 [FlutterSecureStorage]，并自动同步到 [ApiClient]
/// 的 tokenProvider/tokenClearer，使后续业务请求自动携带 Bearer。
class AuthService {
  AuthService({FlutterSecureStorage? secureStorage, ApiClient? apiClient})
      : _secureStorage = secureStorage ?? const FlutterSecureStorage(),
        _api = apiClient ?? ApiClient.instance;

  final FlutterSecureStorage _secureStorage;
  final ApiClient _api;

  /// 登录（对应 POST /trpc/auth.login 或 REST 等价端点）
  ///
  /// 成功后保存 token + 用户信息，并注入 ApiClient。
  Future<LoginResponse> login(String email, String password) async {
    final response = await _api.post<Map<String, dynamic>>(
      '${AppConstants.trpcPrefix}/auth.login',
      data: LoginRequest(email: email, password: password).toJson(),
    );

    final login = LoginResponse.fromJson(response.data!);
    await saveToken(login.token);
    await _secureStorage.write(
      key: StorageKeys.currentUser,
      value: _encodeUser(login.user),
    );
    debugPrint('[AuthService] 登录成功：${login.user.email}');
    return login;
  }

  /// 注册（对应 POST /trpc/auth.register 或 REST 等价端点）
  Future<LoginResponse> register(
    String email,
    String password, {
    String? name,
  }) async {
    final response = await _api.post<Map<String, dynamic>>(
      '${AppConstants.trpcPrefix}/auth.register',
      data: RegisterRequest(email: email, password: password, name: name).toJson(),
    );

    final login = LoginResponse.fromJson(response.data!);
    await saveToken(login.token);
    await _secureStorage.write(
      key: StorageKeys.currentUser,
      value: _encodeUser(login.user),
    );
    debugPrint('[AuthService] 注册成功：${login.user.email}');
    return login;
  }

  /// 退出登录（清空本地 token + 用户信息）
  Future<void> logout() async {
    try {
      await _secureStorage.delete(key: StorageKeys.accessToken);
      await _secureStorage.delete(key: StorageKeys.currentUser);
    } catch (e) {
      debugPrint('[AuthService] logout 清理失败: $e');
    }
    debugPrint('[AuthService] 已退出登录');
  }

  /// 获取当前登录用户（对应 GET /trpc/auth.me）
  ///
  /// 无 token 或请求失败时返回 null。
  Future<User?> getCurrentUser() async {
    final token = await getToken();
    if (token == null || token.isEmpty) return null;

    try {
      final response = await _api.get<Map<String, dynamic>>(
        '${AppConstants.trpcPrefix}/auth.me',
      );
      return User.fromJson(response.data!);
    } on DioException catch (e) {
      debugPrint('[AuthService] getCurrentUser 失败: ${e.message}');
      return null;
    }
  }

  /// 保存 token 到 secure storage，并注入 ApiClient 的 tokenProvider。
  Future<void> saveToken(String token) async {
    await _secureStorage.write(key: StorageKeys.accessToken, value: token);
    // 将 token 提供者同步给 ApiClient，使其后续请求自动携带 Bearer。
    ApiClient.tokenProvider = () async => token;
    ApiClient.tokenClearer = clearToken;
  }

  /// 读取当前 token（null 表示未登录）
  Future<String?> getToken() async {
    return _secureStorage.read(key: StorageKeys.accessToken);
  }

  /// 清除 token（401 时由 ApiClient 调用）
  Future<void> clearToken() async {
    await _secureStorage.delete(key: StorageKeys.accessToken);
    await _secureStorage.delete(key: StorageKeys.currentUser);
  }

  /// 从本地缓存读取上次登录的用户信息（无需网络请求）
  Future<User?> getCachedUser() async {
    final raw = await _secureStorage.read(key: StorageKeys.currentUser);
    if (raw == null || raw.isEmpty) return null;
    try {
      return _decodeUser(raw);
    } catch (e) {
      debugPrint('[AuthService] 解析缓存用户失败: $e');
      return null;
    }
  }

  String _encodeUser(User user) => user.toJson().toString();

  User _decodeUser(String raw) {
    // TODO(week1): 缓存用户采用 JSON 字符串存储，此处简化解析。
    // 完整实现应使用 jsonDecode + User.fromJson。
    throw UnimplementedError('getCachedUser 解析待实现');
  }
}
