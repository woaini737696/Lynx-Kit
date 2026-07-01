// ignore_for_file: directives_ordering

/// LynxKit 共享常量
///
/// 后端 API 地址：http://localhost:4000/trpc（tRPC 端点）
/// 后端 OpenAPI spec：http://localhost:4000/openapi.json
class AppConstants {
  AppConstants._();

  /// 默认后端 API 基地址（开发环境）
  static const String defaultApiBaseUrl = 'http://localhost:4000';

  /// tRPC 端点前缀
  static const String trpcPrefix = '/trpc';

  /// OpenAPI spec 地址
  static const String openApiSpecPath = '/openapi.json';

  /// HTTP 默认超时（毫秒）
  static const int defaultTimeoutMs = 30000;
}

/// 本地存储键名（flutter_secure_storage / SharedPreferences 通用）
class StorageKeys {
  StorageKeys._();

  /// JWT 访问令牌
  static const String accessToken = 'lynxkit.access_token';

  /// 刷新令牌（预留）
  static const String refreshToken = 'lynxkit.refresh_token';

  /// 当前登录用户信息缓存
  static const String currentUser = 'lynxkit.current_user';

  /// 是否启用生物识别登录
  static const String biometricEnabled = 'lynxkit.biometric_enabled';

  /// 主题模式（light/dark/system）
  static const String themeMode = 'lynxkit.theme_mode';

  /// 最近选择的服务器 ID
  static const String lastServerId = 'lynxkit.last_server_id';

  /// 推送设备 token
  static const String deviceToken = 'lynxkit.device_token';
}
