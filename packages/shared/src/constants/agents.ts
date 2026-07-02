/**
 * 9 层 Agent 元数据 - LynxKit v1.0
 *
 * 流水线分层（对应方案 §3.3）：
 *  ① 意图识别 → ② 架构师 → ③ 需求澄清
 *  ↓
 *  ④ 产品经理 ∥ ⑤ 设计师 （并行）
 *  ↓
 *  ⑥ 前端开发 → ⑦ 后端开发 → ⑧ AI 集成 （串行）
 *  ↓
 *  ⑨ 测试修复 （循环，最多 maxRetryRounds 轮）
 *  ↓
 *  ⑩ 部署发布
 */

import { AgentRole } from "../types/build.js";
import { AIProvider } from "../types/ai.js";

/**
 * Agent 元数据
 */
export interface AgentMeta {
  /** Agent 角色 ID */
  id: AgentRole;
  /** 展示名 */
  name: string;
  /** 流水线步骤序号（1~10） */
  step: number;
  /** 职责描述 */
  description: string;
  /** 默认模型配置 */
  defaultModel: {
    /** 默认 Provider */
    provider: AIProvider;
    /** 默认模型 ID */
    model: string;
  };
  /** 是否可与相邻 Agent 并行执行 */
  parallel?: boolean;
  /** 失败重试次数（默认 0） */
  retryCount?: number;
}

/**
 * 9 层 Agent 完整元数据（共 10 个角色，TEST_FIX 与 DEPLOY 合并为"9 层"概念）
 *
 * 默认模型选择策略：
 * - 意图识别 / 澄清：使用低成本快速模型（GLM-4-Flash / Qwen Turbo）
 * - 架构师 / PM：使用推理强模型（DeepSeek-R1 / GLM-4-Plus）
 * - 前端 / 后端 / AI 集成：使用代码模型（DeepSeek-Coder / Qwen-Coder-Plus）
 * - 测试修复：使用代码模型 + 重试
 * - 部署：使用低成本模型即可
 */
export const AGENTS: AgentMeta[] = [
  {
    id: AgentRole.INTENT,
    name: "意图识别 Agent",
    step: 1,
    description: "解析用户自然语言输入，匹配 8 类产品类型，输出置信度",
    defaultModel: { provider: AIProvider.GLM, model: "glm-4-flash" },
    retryCount: 1,
  },
  {
    id: AgentRole.ARCHITECT,
    name: "架构师 Agent",
    step: 2,
    description: "根据产品类型输出技术栈与目录结构（Architecture）",
    defaultModel: { provider: AIProvider.GLM, model: "glm-4-plus" },
    retryCount: 1,
  },
  {
    id: AgentRole.CLARIFY,
    name: "需求澄清 Agent",
    step: 3,
    description: "主动询问用户补充关键信息，输出结构化 BuildConfig",
    defaultModel: { provider: AIProvider.QWEN, model: "qwen-plus" },
    retryCount: 1,
  },
  {
    id: AgentRole.PRODUCT_MANAGER,
    name: "产品经理 Agent",
    step: 4,
    description: "拆解 PRD：功能列表 / 用户故事 / 验收标准",
    defaultModel: { provider: AIProvider.DEEPSEEK, model: "deepseek-reasoner" },
    parallel: true,
    retryCount: 1,
  },
  {
    id: AgentRole.DESIGNER,
    name: "设计师 Agent",
    step: 5,
    description: "产出设计系统：色板 / 字体 / 组件库 / 页面骨架",
    defaultModel: { provider: AIProvider.GLM, model: "glm-4-plus" },
    parallel: true,
    retryCount: 1,
  },
  {
    id: AgentRole.FRONTEND_DEV,
    name: "前端开发 Agent",
    step: 6,
    description: "按 Architecture.frontend 生成 Next.js / Expo / Tauri 代码",
    defaultModel: { provider: AIProvider.DEEPSEEK, model: "deepseek-coder" },
    retryCount: 2,
  },
  {
    id: AgentRole.BACKEND_DEV,
    name: "后端开发 Agent",
    step: 7,
    description: "按 Architecture.backend 生成 Hono 路由 / Prisma Schema / 中间件",
    defaultModel: { provider: AIProvider.DEEPSEEK, model: "deepseek-coder" },
    retryCount: 2,
  },
  {
    id: AgentRole.AI_INTEGRATION,
    name: "AI 集成 Agent",
    step: 8,
    description: "对接用户配置的 AI Provider，封装统一调用层与提示词模板",
    defaultModel: { provider: AIProvider.QWEN, model: "qwen-coder-plus" },
    retryCount: 2,
  },
  {
    id: AgentRole.TEST_FIX,
    name: "测试修复 Agent",
    step: 9,
    description: "运行测试，按 FixLevel（L1/L2/L3）分级修复，循环至全绿",
    defaultModel: { provider: AIProvider.DEEPSEEK, model: "deepseek-coder" },
    retryCount: 3,
  },
  {
    id: AgentRole.DEPLOY,
    name: "部署发布 Agent",
    step: 10,
    description: "构建产物并部署到目标环境（Vercel / 自托管 / 桌面端打包）",
    defaultModel: { provider: AIProvider.GLM, model: "glm-4-flash" },
    retryCount: 1,
  },
];

/**
 * 根据 Agent 角色获取元数据
 */
export function getAgentMeta(role: AgentRole): AgentMeta | undefined {
  return AGENTS.find((a) => a.id === role);
}

/**
 * 按步骤序号获取 Agent
 */
export function getAgentByStep(step: number): AgentMeta | undefined {
  return AGENTS.find((a) => a.step === step);
}

/**
 * 获取串行执行的 Agent 列表（按 step 排序，排除并行标记的次要分支）
 */
export function getSerialAgents(): AgentMeta[] {
  return AGENTS.filter((a) => !a.parallel).sort((a, b) => a.step - b.step);
}

/**
 * 获取并行执行的 Agent 列表
 */
export function getParallelAgents(): AgentMeta[] {
  return AGENTS.filter((a) => a.parallel);
}
