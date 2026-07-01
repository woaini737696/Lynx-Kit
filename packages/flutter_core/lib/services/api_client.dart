// ignore_for_file: directives_ordering

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_core/utils/constants.dart';

/// Token 提供者抽象，由各端注入实现（避免核心库直接依赖平台插件）。
typedef TokenProvider = Future<String?> Function();

/// Token 清除回调，401 时调用。
typedef TokenClearer = Future<void> Function();

/// 401 未授权回调（通常用于跳转登录页），由各端注入。
typedef UnauthorizedCallback = void Function();

/// 统一 API 异常（封装 dio 错误，便于 UI 层展示）
class ApiException implements Exception {
  ApiException({
    required this.statusCode,
    required this.message,
    this.rawError,
  });

  final int? statusCode;
  final String message;
  final Object? rawError;

  @override
  String toString() => 'ApiException($statusCode): $message';
}

/// Dio 封装的 HTTP 单例客户端
///
/// - 自动注入 Bearer token（从 [tokenProvider] 读取，由各端用 secure storage 实现）
/// - 401 自动清 token 并触发 [onUnauthorized]
/// - 5xx 统一抛出 [ApiException]
/// - 默认超时 30s
class ApiClient {
  ApiClient._internal(this._dio);

  static ApiClient? _instance;

  final Dio _dio;

  /// 单例访问（需先调用 [init]）
  static ApiClient get instance {
    final inst = _instance;
    if (inst == null) {
      throw StateError('ApiClient 未初始化，请先调用 ApiClient.init()');
    }
    return inst;
  }

  /// 当前 token 提供者
  static TokenProvider? tokenProvider;

  /// 当前 token 清除者
  static TokenClearer? tokenClearer;

  /// 401 未授权回调（跳登录页）
  static UnauthorizedCallback? onUnauthorized;

  /// 初始化 ApiClient（应在 app 启动早期调用）
  ///
  /// [baseUrl] 后端基地址，默认 http://localhost:4000
  static ApiClient init({String? baseUrl}) {
    final dio = Dio(
      BaseOptions(
        baseUrl: baseUrl ?? AppConstants.defaultApiBaseUrl,
        connectTimeout: const Duration(milliseconds: AppConstants.defaultTimeoutMs),
        receiveTimeout: const Duration(milliseconds: AppConstants.defaultTimeoutMs),
        sendTimeout: const Duration(milliseconds: AppConstants.defaultTimeoutMs),
        headers: <String, dynamic>{
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        validateStatus: (_) => true,
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await tokenProvider?.call();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onResponse: (response, handler) {
          final status = response.statusCode ?? 0;
          if (status >= 200 && status < 300) {
            handler.next(response);
            return;
          }
          if (status == 401) {
            _handleUnauthorized();
            handler.reject(
              DioException(
                requestOptions: response.requestOptions,
                response: response,
                type: DioExceptionType.badResponse,
              ),
            );
            return;
          }
          // 5xx 统一抛 ApiException
          final message = _extractMessage(response.data) ?? '服务器错误 ($status)';
          if (status >= 500) {
            debugPrint('[ApiClient] 5xx: $message');
          }
          handler.reject(
            DioException(
              requestOptions: response.requestOptions,
              response: response,
              type: DioExceptionType.badResponse,
              error: ApiException(statusCode: status, message: message),
            ),
          );
        },
        onError: (e, handler) {
          debugPrint('[ApiClient] 网络错误: ${e.message}');
          handler.next(e);
        },
      ),
    );

    final client = ApiClient._internal(dio);
    _instance = client;
    return client;
  }

  static void _handleUnauthorized() {
    debugPrint('[ApiClient] 401 未授权，清 token 并触发登录跳转');
    // 异步清除 token
    tokenClearer?.call();
    onUnauthorized?.call();
  }

  static String? _extractMessage(dynamic data) {
    if (data is Map<String, dynamic>) {
      final msg = data['message'] ?? data['error'];
      if (msg is String) return msg;
    }
    return null;
  }

  /// 暴露原始 dio（高级用法）
  Dio get dio => _dio;

  /// GET 请求
  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) =>
      _dio.get<T>(
        path,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      );

  /// POST 请求
  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) =>
      _dio.post<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      );

  /// PUT 请求
  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) =>
      _dio.put<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      );

  /// DELETE 请求
  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) =>
      _dio.delete<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      );
}
