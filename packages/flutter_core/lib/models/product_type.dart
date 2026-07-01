// ignore_for_file: directives_ordering

import 'package:flutter/material.dart';

import 'project.dart';

/// 产品类型元数据（对应 shared/constants/product-types.ts ProductTypeMeta）
///
/// 用于在桌面端/移动端 UI 中渲染产品选择卡片。
class ProductTypeMeta {
  const ProductTypeMeta({
    required this.id,
    required this.name,
    required this.description,
    required this.architecture,
    required this.techStack,
    required this.applicableScenes,
    required this.keywords,
    required this.color,
    required this.icon,
  });

  /// 产品类型 ID
  final ProjectType id;

  /// 显示名称
  final String name;

  /// 描述
  final String description;

  /// 架构标识
  final String architecture;

  /// 技术栈
  final List<String> techStack;

  /// 适用场景
  final List<String> applicableScenes;

  /// 关键词匹配（意图识别 Agent 使用）
  final List<String> keywords;

  /// 主题色（16 进制字符串，用于卡片视觉区分）
  final String color;

  /// Material Icon 名称
  final String icon;

  /// 解析主题色为 [Color]
  Color get themeColor => _parseColor(color);

  /// 解析图标名为 [IconData]
  IconData get iconData => _iconForName(icon);

  static Color _parseColor(String hex) {
    final v = hex.replaceFirst('#', '');
    if (v.length == 6) {
      return Color(int.parse('FF$v', radix: 16));
    }
    return Color(int.parse(v, radix: 16));
  }

  static IconData _iconForName(String name) {
    switch (name) {
      case 'web':
        return Icons.language;
      case 'calendar_today':
        return Icons.calendar_today;
      case 'article':
        return Icons.article;
      case 'shopping_bag':
        return Icons.shopping_bag;
      case 'event':
        return Icons.event;
      case 'dashboard':
        return Icons.dashboard;
      default:
        return Icons.widgets;
    }
  }
}

/// 全部产品类型元数据（对应 shared/constants/product-types.ts PRODUCT_TYPES）
const List<ProductTypeMeta> productTypes = <ProductTypeMeta>[
  ProductTypeMeta(
    id: ProjectType.staticSite,
    name: '品牌展示',
    description: '个人官网、作品集、企业官网、落地页',
    architecture: 'Static-Site',
    techStack: ['Next.js 15', 'Tailwind CSS', 'Caddy'],
    applicableScenes: ['个人官网', '作品集', '企业官网', '落地页'],
    keywords: ['官网', '网站', '主页', '介绍', '展示', '作品集', 'portfolio', 'landing'],
    color: '#3B82F6',
    icon: 'web',
  ),
  ProductTypeMeta(
    id: ProjectType.serviceBooking,
    name: '服务预约',
    description: '教练预约、美容理疗、摄影档期、咨询预约',
    architecture: 'Service-Booking',
    techStack: ['Next.js 15', 'PostgreSQL', 'PWA'],
    applicableScenes: ['教练预约', '美容理疗', '摄影档期', '咨询预约'],
    keywords: ['预约', '预订', '档期', '时间', '教练', '美容', '咨询', '拍摄'],
    color: '#10B981',
    icon: 'calendar_today',
  ),
  ProductTypeMeta(
    id: ProjectType.contentPublish,
    name: '内容发布',
    description: '个人博客、知识库、newsletter、文档站',
    architecture: 'Content-Publish',
    techStack: ['Next.js 15', 'PostgreSQL', 'MDX'],
    applicableScenes: ['个人博客', '知识库', 'newsletter', '文档站'],
    keywords: ['博客', '文章', '内容', 'newsletter', '知识库', '文档'],
    color: '#F59E0B',
    icon: 'article',
  ),
  ProductTypeMeta(
    id: ProjectType.lightCommerce,
    name: '电商交易',
    description: '手作商城、知识付费、会员订阅、虚拟商品',
    architecture: 'Light-Commerce',
    techStack: ['Next.js 15', 'PostgreSQL', 'Stripe'],
    applicableScenes: ['手作商城', '知识付费', '会员订阅', '虚拟商品'],
    keywords: ['商城', '卖', '购买', '商品', '店铺', '付费', '会员', '订阅'],
    color: '#EF4444',
    icon: 'shopping_bag',
  ),
  ProductTypeMeta(
    id: ProjectType.eventManage,
    name: '活动管理',
    description: '活动报名、会议签到、课程管理、聚会组织',
    architecture: 'Event-Manage',
    techStack: ['Next.js 15', 'PostgreSQL', 'PWA'],
    applicableScenes: ['活动报名', '会议签到', '课程管理', '聚会组织'],
    keywords: ['活动', '报名', '签到', '会议', '课程', '聚会', '沙龙'],
    color: '#8B5CF6',
    icon: 'event',
  ),
  ProductTypeMeta(
    id: ProjectType.adminDashboard,
    name: '管理后台',
    description: '内部工具、客户管理、数据看板、CRM 轻量版',
    architecture: 'Admin-Dashboard',
    techStack: ['Next.js 15', 'PostgreSQL', 'shadcn/ui'],
    applicableScenes: ['内部工具', '客户管理', '数据看板', 'CRM'],
    keywords: ['管理', '后台', 'CRM', '数据', '看板', '统计', '工具'],
    color: '#06B6D4',
    icon: 'dashboard',
  ),
];

/// 根据产品类型 ID 获取元数据（对应 getProductTypeMeta）
ProductTypeMeta? getProductTypeMeta(ProjectType type) {
  for (final meta in productTypes) {
    if (meta.id == type) {
      return meta;
    }
  }
  return null;
}

/// 关键词匹配结果（对应 matchProductType 返回值）
class ProductTypeMatch {
  const ProductTypeMatch({required this.type, required this.confidence});

  final ProjectType type;

  /// 置信度 0~1
  final double confidence;
}

/// 根据关键词匹配产品类型（对应 matchProductType，意图识别 Agent 使用）
ProductTypeMatch? matchProductType(String userInput) {
  for (final meta in productTypes) {
    for (final keyword in meta.keywords) {
      if (userInput.contains(keyword)) {
        return const ProductTypeMatch(type: meta.id, confidence: 0.9);
      }
    }
  }
  return null;
}
