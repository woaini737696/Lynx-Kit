/**
 * 构建会话相关类型 - LynxKit v1.0
 *
 * 描述 AI 编排引擎（9 层 Agent 流水线）在执行过程中的会话状态、
 * 架构产物、生成代码以及运行日志。
 */

import type { ProductType } from "./product.js";

/**
 * 构建会话状态机
 *
 * - DRAFT：草稿态，用户输入需求未启动
 * - CLARIFYING：澄清中，③ CLARIFY Agent 主动询问
 * - ARCHITECTING：架构设计中，② ARCHITECT 输出技术栈
 * - DEVELOPING：开发中，⑥⑦⑧ Agent 串行生成代码
 * - TESTING：测试中，⑨ TEST_FIX Agent 循环修复
 * - DEPLOYING：部署中，⑩ DEPLOY Agent 发布
 * - DEPLOYED：部署完成，可访问 deployUrl
 * - ERROR：任意阶段错误中断
 */
export enum BuildStatus {
  DRAFT = "draft",
  CLARIFYING = "clarifying",
  ARCHITECTING = "architecting",
  DEVELOPING = "developing",
  TESTING = "testing",
  DEPLOYING = "deploying",
  DEPLOYED = "deployed",
  ERROR = "error",
}

/**
 * 9 层 Agent 角色枚举（对应流水线 ① ~ ⑩ 共 10 个 step）
 *
 * 注意：AgentRole 包含 10 个角色，其中 TEST_FIX 与 DEPLOY 合并称为"9 层"
 * （流水线分层：①意图 ②架构 ③澄清 ④PM ⑤设计 ⑥前端 ⑦后端 ⑧AI集成 ⑨测试修复 ⑩部署）。
 */
export enum AgentRole {
  /** ① 意图识别 */
  INTENT = "intent",
  /** ② 架构师 */
  ARCHITECT = "architect",
  /** ③ 需求澄清 */
  CLARIFY = "clarify",
  /** ④ 产品经理 */
  PRODUCT_MANAGER = "pm",
  /** ⑤ 设计师 */
  DESIGNER = "designer",
  /** ⑥ 前端开发 */
  FRONTEND_DEV = "frontend",
  /** ⑦ 后端开发 */
  BACKEND_DEV = "backend",
  /** ⑧ AI 集成 */
  AI_INTEGRATION = "ai_int",
  /** ⑨ 测试修复 */
  TEST_FIX = "test",
  /** ⑩ 部署发布 */
  DEPLOY = "deploy",
}

/**
 * 测试修复等级
 *
 * - L1：单测级（仅单元测试失败）
 * - L2：集成级（接口/数据库集成失败）
 * - L3：架构级（需重新走 ② ARCHITECT）
 */
export enum FixLevel {
  L1 = "L1",
  L2 = "L2",
  L3 = "L3",
}

/**
 * Agent 日志级别
 */
export enum LogLevel {
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  DEBUG = "debug",
}

/**
 * 构建配置，由 ④ PRODUCT_MANAGER Agent 产出的结构化需求文档。
 * 字段不固定，按产品类型扩展，故使用索引签名。
 */
export interface BuildConfig {
  /** 动态配置键值集合 */
  [key: string]: unknown;
}

/**
 * 架构产物，由 ② ARCHITECT Agent 生成
 */
export interface Architecture {
  /** 前端技术栈 */
  frontend: string[];
  /** 后端技术栈 */
  backend: string[];
  /** 数据库技术栈 */
  database: string[];
  /** AI 集成相关技术 */
  ai: string[];
  /** 部署相关技术 */
  deploy: string[];
}

/**
 * 单个生成代码文件
 */
export interface CodeFile {
  /** 文件相对路径，如 `src/pages/index.tsx` */
  path: string;
  /** 文件内容 */
  content: string;
  /** 编程语言，如 `typescript` / `tsx` / `sql` */
  language: string;
}

/**
 * 已生成的代码集合
 */
export interface GeneratedCode {
  /** 文件列表 */
  files: CodeFile[];
  /** 文件总数 */
  totalFiles: number;
  /** 总代码行数 */
  totalLines: number;
}

/**
 * 构建会话主体
 */
export interface BuildSession {
  /** 会话 ID，前缀 `bld_` */
  id: string;
  /** 所属用户 ID */
  userId: string;
  /** 产品类型 */
  productType: ProductType;
  /** 当前会话状态 */
  status: BuildStatus;
  /** 用户输入与 PM 产出的结构化配置 */
  config: BuildConfig;
  /** 架构产物（② ARCHITECT 完成后填充） */
  architecture?: Architecture;
  /** 已生成代码（⑥⑦⑧ 完成后填充） */
  generatedCode?: GeneratedCode;
  /** 部署后可访问 URL（⑩ 完成后填充） */
  deployUrl?: string;
  /** 配置版本号，每次更新 +1 */
  version: number;
  /** 创建时间（ISO 字符串） */
  createdAt: string;
  /** 更新时间（ISO 字符串） */
  updatedAt: string;
}

/**
 * Agent 运行日志（持久化到 AgentLog 表）
 */
export interface AgentLog {
  /** 日志 ID */
  id: string;
  /** 所属构建会话 ID */
  sessionId: string;
  /** 产生日志的 Agent 角色 */
  agent: AgentRole;
  /** 日志级别 */
  level: LogLevel;
  /** 日志消息 */
  message: string;
  /** 附加元数据（如耗时、token 用量、错误堆栈等） */
  metadata?: Record<string, unknown>;
  /** 创建时间（ISO 字符串） */
  createdAt: string;
}

/**
 * Agent 输入（用于驱动单步 Agent 执行）
 */
export interface AgentInput {
  /** 所属会话 ID */
  sessionId: string;
  /** Agent 角色 */
  agent: AgentRole;
  /** 用户原始输入（仅 ① INTENT 用到） */
  userInput?: string;
  /** 上一阶段产物，传入下一阶段作为上下文 */
  context?: Record<string, unknown>;
  /** 当前修复等级（仅 ⑨ TEST_FIX 用到） */
  fixLevel?: FixLevel;
  /** 当前重试轮数 */
  retryRound?: number;
}
