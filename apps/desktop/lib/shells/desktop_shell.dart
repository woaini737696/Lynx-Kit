// ignore_for_file: directives_ordering

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:window_manager/window_manager.dart';

import 'shells/widgets/user_menu_button.dart';
import 'package:flutter_core/state/providers.dart';
import 'package:flutter_core/state/auth_state.dart';

/// 桌面端外壳：左侧 NavigationRail + 顶部应用栏 + 主内容区
class DesktopShell extends ConsumerStatefulWidget {
  const DesktopShell({super.key, required this.child});

  final Widget child;

  @override
  ConsumerState<DesktopShell> createState() => _DesktopShellState();
}

class _DesktopShellState extends ConsumerState<DesktopShell>
    with WindowListener {
  int _selectedIndex = 0;

  static const _destinations = <NavigationRailDestination>[
    NavigationRailDestination(
      icon: Icon(Icons.dashboard_outlined),
      selectedIcon: Icon(Icons.dashboard),
      label: Text('主控台'),
    ),
    NavigationRailDestination(
      icon: Icon(Icons.folder_outlined),
      selectedIcon: Icon(Icons.folder),
      label: Text('项目'),
    ),
    NavigationRailDestination(
      icon: Icon(Icons.dns_outlined),
      selectedIcon: Icon(Icons.dns),
      label: Text('服务器'),
    ),
    NavigationRailDestination(
      icon: Icon(Icons.settings_outlined),
      selectedIcon: Icon(Icons.settings),
      label: Text('设置'),
    ),
  ];

  static const _routes = <String>[
    '/dashboard',
    '/projects',
    '/servers',
    '/settings',
  ];

  @override
  void initState() {
    super.initState();
    windowManager.addListener(this);
    // 监听窗口关闭事件（最小化到托盘）
  }

  @override
  void dispose() {
    windowManager.removeListener(this);
    super.dispose();
  }

  @override
  void onWindowClose() async {
    // 关闭窗口时最小化到系统托盘，而非退出应用
    await windowManager.hide();
  }

  void _onDestinationSelected(int index) {
    setState(() => _selectedIndex = index);
    context.go(_routes[index]);
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authNotifierProvider);
    final user = authState is AuthAuthenticated ? authState.user : null;

    return Scaffold(
      body: Row(
        children: [
          NavigationRail(
            selectedIndex: _selectedIndex,
            extended: MediaQuery.of(context).size.width > 1200,
            onDestinationSelected: _onDestinationSelected,
            labelType: NavigationRailLabelType.all,
            destinations: _destinations,
            leading: Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Column(
                children: [
                  Icon(Icons.apps, color: Theme.of(context).colorScheme.primary, size: 32),
                  const SizedBox(height: 4),
                  const Text('LynxKit', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
          ),
          const VerticalDivider(width: 1),
          Expanded(
            child: Column(
              children: [
                // 顶部应用栏
                Container(
                  height: 56,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: [
                      Text(
                        'LynxKit 桌面端',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const Spacer(),
                      UserMenuButton(user: user),
                    ],
                  ),
                ),
                const Divider(height: 1),
                // 主内容区
                Expanded(child: widget.child),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
