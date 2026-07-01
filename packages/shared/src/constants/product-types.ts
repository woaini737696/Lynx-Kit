import type { ProjectType } from "../types/project.js";

/**
 * 产品类型元数据（与文档 §3.2 对应）
 *
 * 用于在桌面端/移动端 UI 中渲染产品选择卡片。
 */
export interface ProductTypeMeta {
  id: ProjectType;
  name: string;
  description: string;
  architecture: string;
  techStack: string[];
  applicableScenes: string[];
  /** 关键词匹配，用于意图识别 Agent */
  keywords: string[];
  /** 主题色（用于卡片视觉区分） */
  color: string;
  /** 图标标识（Material Icon name） */
  icon: string;
}

export const PRODUCT_TYPES: ProductTypeMeta[] = [
  {
    id: "static-site",
    name: "品牌展示",
    description: "个人官网、作品集、企业官网、落地页",
    architecture: "Static-Site",
    techStack: ["Next.js 15", "Tailwind CSS", "Caddy"],
    applicableScenes: ["个人官网", "作品集", "企业官网", "落地页"],
    keywords: ["官网", "网站", "主页", "介绍", "展示", "作品集", "portfolio", "landing"],
    color: "#3B82F6",
    icon: "web",
  },
  {
    id: "service-booking",
    name: "服务预约",
    description: "教练预约、美容理疗、摄影档期、咨询预约",
    architecture: "Service-Booking",
    techStack: ["Next.js 15", "PostgreSQL", "PWA"],
    applicableScenes: ["教练预约", "美容理疗", "摄影档期", "咨询预约"],
    keywords: ["预约", "预订", "档期", "时间", "教练", "美容", "咨询", "拍摄"],
    color: "#10B981",
    icon: "calendar_today",
  },
  {
    id: "content-publish",
    name: "内容发布",
    description: "个人博客、知识库、newsletter、文档站",
    architecture: "Content-Publish",
    techStack: ["Next.js 15", "PostgreSQL", "MDX"],
    applicableScenes: ["个人博客", "知识库", "newsletter", "文档站"],
    keywords: ["博客", "文章", "内容", "newsletter", "知识库", "文档"],
    color: "#F59E0B",
    icon: "article",
  },
  {
    id: "light-commerce",
    name: "电商交易",
    description: "手作商城、知识付费、会员订阅、虚拟商品",
    architecture: "Light-Commerce",
    techStack: ["Next.js 15", "PostgreSQL", "Stripe"],
    applicableScenes: ["手作商城", "知识付费", "会员订阅", "虚拟商品"],
    keywords: ["商城", "卖", "购买", "商品", "店铺", "付费", "会员", "订阅"],
    color: "#EF4444",
    icon: "shopping_bag",
  },
  {
    id: "event-manage",
    name: "活动管理",
    description: "活动报名、会议签到、课程管理、聚会组织",
    architecture: "Event-Manage",
    techStack: ["Next.js 15", "PostgreSQL", "PWA"],
    applicableScenes: ["活动报名", "会议签到", "课程管理", "聚会组织"],
    keywords: ["活动", "报名", "签到", "会议", "课程", "聚会", "沙龙"],
    color: "#8B5CF6",
    icon: "event",
  },
  {
    id: "admin-dashboard",
    name: "管理后台",
    description: "内部工具、客户管理、数据看板、CRM 轻量版",
    architecture: "Admin-Dashboard",
    techStack: ["Next.js 15", "PostgreSQL", "shadcn/ui"],
    applicableScenes: ["内部工具", "客户管理", "数据看板", "CRM"],
    keywords: ["管理", "后台", "CRM", "数据", "看板", "统计", "工具"],
    color: "#06B6D4",
    icon: "dashboard",
  },
];

/**
 * 根据产品类型 ID 获取元数据
 */
export function getProductTypeMeta(type: ProjectType): ProductTypeMeta | undefined {
  return PRODUCT_TYPES.find((p) => p.id === type);
}

/**
 * 根据关键词匹配产品类型（意图识别 Agent 使用）
 */
export function matchProductType(userInput: string): {
  type: ProjectType;
  confidence: number;
} | null {
  for (const meta of PRODUCT_TYPES) {
    if (meta.keywords.some((w) => userInput.includes(w))) {
      return { type: meta.id, confidence: 0.9 };
    }
  }
  return null;
}
