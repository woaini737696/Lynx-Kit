// ignore_for_file: directives_ordering

/// LynxKit 跨端共享核心库统一入口
///
/// 桌面端与移动端通过 `import 'package:flutter_core/flutter_core.dart';`
/// 即可访问全部共享 model / service / state / theme / widget / utils。
library flutter_core;

// 模型层
export 'models/models.dart';

// 服务层
export 'services/api_client.dart';
export 'services/auth_service.dart';
export 'services/project_service.dart';
export 'services/server_service.dart';
export 'services/template_service.dart';
export 'services/deploy_service.dart';

// 状态层
export 'state/auth_state.dart';
export 'state/project_state.dart';
export 'state/server_state.dart';
export 'state/providers.dart';

// 主题层
export 'theme/app_colors.dart';
export 'theme/app_theme.dart';
export 'theme/app_typography.dart';

// 组件层
export 'widgets/status_badge.dart';
export 'widgets/project_card.dart';
export 'widgets/server_card.dart';
export 'widgets/empty_state.dart';
export 'widgets/loading_indicator.dart';
export 'widgets/error_view.dart';

// 工具层
export 'utils/constants.dart';
export 'utils/extensions.dart';
