// ignore_for_file: directives_ordering

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:flutter_core/models/project.dart';
import 'package:flutter_core/services/project_service.dart';
import 'providers.dart';

/// 项目列表状态
class ProjectListState {
  const ProjectListState({
    this.items = const <Project>[],
    this.isLoading = false,
    this.error,
    this.hasMore = true,
  });

  final List<Project> items;
  final bool isLoading;
  final String? error;
  final bool hasMore;

  ProjectListState copyWith({
    List<Project>? items,
    bool? isLoading,
    String? error,
    bool? hasMore,
  }) {
    return ProjectListState(
      items: items ?? this.items,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      hasMore: hasMore ?? this.hasMore,
    );
  }
}

/// 项目列表 Notifier
class ProjectListNotifier extends StateNotifier<ProjectListState> {
  ProjectListNotifier(this._service) : super(const ProjectListState());

  final ProjectService _service;

  int _page = 1;
  static const int _pageSize = 20;

  /// 拉取首页（下拉刷新）
  Future<void> refresh() async {
    _page = 1;
    state = const ProjectListState();
    await loadMore();
  }

  /// 加载更多（上拉分页）
  Future<void> loadMore() async {
    if (state.isLoading || !state.hasMore) return;
    state = state.copyWith(isLoading: true, error: null);
    try {
      final result = await _service.list(page: _page, pageSize: _pageSize);
      final merged = <Project>[...state.items, ...result.items];
      state = ProjectListState(
        items: merged,
        hasMore: result.hasMore,
      );
      _page += 1;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }
}

/// 项目详情状态（含加载/错误标志）
class ProjectDetailState {
  const ProjectDetailState({this.project, this.isLoading = false, this.error});

  final Project? project;
  final bool isLoading;
  final String? error;

  ProjectDetailState copyWith({
    Project? project,
    bool? isLoading,
    String? error,
  }) {
    return ProjectDetailState(
      project: project ?? this.project,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

/// 项目详情 Notifier（按 projectId 创建实例，由 family provider 装配）
class ProjectDetailNotifier extends StateNotifier<ProjectDetailState> {
  ProjectDetailNotifier(this._service, this.projectId)
      : super(const ProjectDetailState()) {
    load();
  }

  final ProjectService _service;
  final String projectId;

  /// 加载项目详情
  Future<void> load() async {
    state = const ProjectDetailState(isLoading: true);
    try {
      final project = await _service.get(projectId);
      state = ProjectDetailState(project: project);
    } catch (e) {
      state = ProjectDetailState(error: e.toString());
    }
  }

  /// 刷新
  Future<void> refresh() => load();

  /// 更新配置并刷新
  Future<void> updateConfig(Map<String, dynamic> config) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final project = await _service.updateConfig(projectId, config);
      state = ProjectDetailState(project: project);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }
}
