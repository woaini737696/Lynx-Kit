/**
 * 8 类产品类型元数据 - LynxKit v1.0
 *
 * 与 types/product.ts 中的 ProductType 枚举严格对齐。
 * 用于意图识别 Agent 的关键词匹配、UI 卡片展示、技术栈预选。
 */

import { ProductType } from "../types/product";

/**
 * 产品类型元数据
 */
export interface ProductTypeMeta {
  /** 产品类型 ID */
  id: ProductType;
  /** 展示名 */
  name: string;
  /** 简介 */
  description: string;
  /** 推荐技术栈 */
  techStack: string[];
  /** 适用场景 */
  applicableScenes: string[];
  /** 意图识别关键词 */
  keywords: string[];
  /** 主题色（十六进制） */
  color: string;
  /** 图标标识 */
  icon: string;
  /** 周次归属（开发路线图） */
  week: string;
}

/**
 * 8 类产品类型完整元数据
 */
export const PRODUCT_TYPES: ProductTypeMeta[] = [
  {
    id: ProductType.SOCIAL,
    name: "AI 社交",
    description: "交友/匹配/陪伴/社群",
    techStack: ["Next", "Hono", "PostgreSQL", "pgvector", "WebSocket"],
    applicableScenes: ["AI 交友", "AI 陪伴", "AI 社群", "AI 匹配"],
    keywords: ["社交", "交友", "匹配", "陪伴", "聊天", "社群", "社区", "social", "匹配", "相亲"],
    color: "#FF6B35",
    icon: "heart",
    week: "W1",
  },
  {
    id: ProductType.SYSTEM,
    name: "AI 系统",
    description: "平台/中台/自动化",
    techStack: ["Next", "Hono", "PostgreSQL", "Redis"],
    applicableScenes: ["AI 平台", "AI 中台", "AI 自动化"],
    keywords: ["系统", "平台", "中台", "自动化", "system"],
    color: "#3B82F6",
    icon: "server",
    week: "W2",
  },
  {
    id: ProductType.WORKSTATION,
    name: "AI 工作站",
    description: "工具/创作/知识管理",
    techStack: ["Next", "Hono", "PostgreSQL", "Tauri"],
    applicableScenes: ["AI 工具", "AI 创作", "AI 知识库"],
    keywords: ["工具", "工作站", "创作", "知识管理", "笔记", "workstation"],
    color: "#10B981",
    icon: "briefcase",
    week: "W2",
  },
  {
    id: ProductType.DATA,
    name: "AI 数据分析",
    description: "BI/报表/可视化/洞察",
    techStack: ["Next", "Hono", "PostgreSQL", "pgvector", "ECharts"],
    applicableScenes: ["AI BI", "AI 报表", "AI 可视化", "AI 洞察"],
    keywords: ["数据", "分析", "报表", "可视化", "BI", "洞察", "data"],
    color: "#F59E0B",
    icon: "chart",
    week: "W4",
  },
  {
    id: ProductType.ADMIN,
    name: "AI 管理后台",
    description: "CRM/ERP/OA/运营",
    techStack: ["Next", "Hono", "PostgreSQL", "shadcn/ui"],
    applicableScenes: ["AI CRM", "AI ERP", "AI OA", "AI 运营"],
    keywords: ["管理", "后台", "CRM", "ERP", "OA", "运营", "admin"],
    color: "#06B6D4",
    icon: "dashboard",
    week: "W3",
  },
  {
    id: ProductType.APP,
    name: "AI 应用 App",
    description: "小程序/移动端/客户端",
    techStack: ["Expo", "Hono", "PostgreSQL"],
    applicableScenes: ["AI 小程序", "AI 移动端", "AI 客户端"],
    keywords: ["App", "应用", "小程序", "移动端", "客户端", "app"],
    color: "#8B5CF6",
    icon: "mobile",
    week: "W3",
  },
  {
    id: ProductType.MARKETING,
    name: "AI 营销",
    description: "广告/投放/增长/获客",
    techStack: ["Next", "Hono", "PostgreSQL", "Redis"],
    applicableScenes: ["AI 广告", "AI 投放", "AI 增长", "AI 获客"],
    keywords: ["营销", "广告", "投放", "增长", "获客", "marketing"],
    color: "#EF4444",
    icon: "megaphone",
    week: "W4",
  },
  {
    id: ProductType.HARDWARE,
    name: "AI 硬件",
    description: "IoT/智能家居/机器人",
    techStack: ["Tauri", "Hono", "PostgreSQL", "MQTT"],
    applicableScenes: ["AI IoT", "AI 智能家居", "AI 机器人"],
    keywords: ["硬件", "IoT", "智能家居", "机器人", "hardware"],
    color: "#64748B",
    icon: "cpu",
    week: "W4+",
  },
];

/**
 * 根据产品类型 ID 获取元数据
 */
export function getProductTypeMeta(type: ProductType): ProductTypeMeta | undefined {
  return PRODUCT_TYPES.find((p) => p.id === type);
}

/**
 * 根据用户输入文本匹配产品类型
 *
 * 匹配规则：
 * - 命中关键词数越多，置信度越高
 * - 基础置信度 0.5，每多命中一个关键词 +0.15
 * - 上限 0.95
 *
 * @returns 命中类型与置信度，未命中返回 null
 */
export function matchProductType(
  userInput: string,
): { type: ProductType; confidence: number } | null {
  let bestMatch: { type: ProductType; confidence: number } | null = null;
  const lower = userInput.toLowerCase();
  for (const meta of PRODUCT_TYPES) {
    const hitCount = meta.keywords.filter((k) =>
      lower.includes(k.toLowerCase()),
    ).length;
    if (hitCount > 0) {
      const confidence = Math.min(0.5 + hitCount * 0.15, 0.95);
      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = { type: meta.id, confidence };
      }
    }
  }
  return bestMatch;
}
