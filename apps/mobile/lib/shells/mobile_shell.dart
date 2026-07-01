// ignore_for_file: directives_ordering

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// 移动端外壳：底部导航栏（4 个 tab：首页/项目/通知/我的）+ 主内容区
class MobileShell extends StatelessWidget {
  const MobileShell({super.key, required this.child});

  final Widget child;

  static const _tabs = <_TabItem>[
    _TabItem(path: '/home', icon: Icons.home_outlined, activeIcon: Icons.home, label: '首页'),
    _TabItem(path: '/projects', icon: Icons.folder_outlined, activeIcon: Icons.folder, label: '项目'),
    _TabItem(path: '/notifications', icon: Icons.notifications_outlined, activeIcon: Icons.notifications, label: '通知'),
    _TabItem(path: '/profile', icon: Icons.person_outline, activeIcon: Icons.person, label: '我的'),
  ];

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    for (var i = 0; i < _tabs.length; i++) {
      if (location.startsWith(_tabs[i].path)) return i;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final index = _currentIndex(context);
    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (i) => context.go(_tabs[i].path),
        destinations: _tabs
            .map((t) => NavigationDestination(
                  icon: Icon(t.icon),
                  selectedIcon: Icon(t.activeIcon),
                  label: t.label,
                ))
            .toList(),
      ),
    );
  }
}

class _TabItem {
  const _TabItem({
    required this.path,
    required this.icon,
    required this.activeIcon,
    required this.label,
  });
  final String path;
  final IconData icon;
  final IconData activeIcon;
  final String label;
}
