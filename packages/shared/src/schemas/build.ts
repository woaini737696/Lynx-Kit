/**
 * 构建会话相关 Zod schema - LynxKit v1.0
 */

import { z } from "zod";
import { ProductType } from "../types/product.js";
import { BuildStatus, AgentRole, FixLevel, LogLevel } from "../types/build.js";

/**
 * 产品类型 enum schema（与 ProductType 一致）
 */
export const productTypeSchema = z.nativeEnum(ProductType);

/**
 * 构建状态 schema
 */
export const buildStatusSchema = z.nativeEnum(BuildStatus);

/**
 * Agent 角色 schema
 */
export const agentRoleSchema = z.nativeEnum(AgentRole);

/**
 * 修复等级 schema
 */
export const fixLevelSchema = z.nativeEnum(FixLevel);

/**
 * 日志级别 schema
 */
export const logLevelSchema = z.nativeEnum(LogLevel);

/**
 * 创建构建会话
 */
export const createBuildSchema = z.object({
  /** 产品类型 */
  productType: productTypeSchema,
  /** 用户原始输入（自然语言需求描述） */
  userInput: z.string().min(1, "需求描述不能为空").max(2000, "需求描述最多 2000 字"),
  /** 是否跳过澄清直接进入开发 */
  skipClarify: z.boolean().optional().default(false),
});

/**
 * 更新构建配置（用户在 ③ CLARIFY 阶段补充信息）
 */
export const updateConfigSchema = z.object({
  /** 会话 ID */
  sessionId: z.string().min(1),
  /** 配置 patch（增量更新） */
  patch: z.record(z.string(), z.unknown()),
  /** 是否完成澄清，进入 ARCHITECTING */
  confirmClarify: z.boolean().optional().default(false),
});

/**
 * 启动单个 Agent（调试或手动重跑）
 */
export const startAgentSchema = z.object({
  /** 会话 ID */
  sessionId: z.string().min(1),
  /** 要启动的 Agent */
  agent: agentRoleSchema,
  /** 覆盖默认模型配置 */
  modelOverride: z
    .object({
      provider: z.string(),
      model: z.string(),
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().int().positive().optional(),
    })
    .optional(),
  /** 是否强制从该 Agent 重新开始（丢弃后续产物） */
  forceRestart: z.boolean().optional().default(false),
});

/**
 * 提交测试修复结果（⑨ TEST_FIX Agent 内部使用）
 */
export const submitFixResultSchema = z.object({
  /** 会话 ID */
  sessionId: z.string().min(1),
  /** 当前修复等级 */
  fixLevel: fixLevelSchema,
  /** 当前重试轮数 */
  retryRound: z.number().int().min(1),
  /** 是否修复成功 */
  success: z.boolean(),
  /** 失败原因（success=false 时必填） */
  failureReason: z.string().optional(),
  /** 修复后的代码 diff（success=true 时填充） */
  patchedFiles: z
    .array(
      z.object({
        path: z.string(),
        content: z.string(),
        language: z.string(),
      }),
    )
    .optional(),
});

/**
 * 部署请求
 */
export const deployBuildSchema = z.object({
  /** 会话 ID */
  sessionId: z.string().min(1),
  /** 部署目标 */
  target: z.enum(["vercel", "self-hosted", "desktop", "preview"]),
  /** 自定义部署参数 */
  options: z.record(z.string(), z.unknown()).optional(),
});

/**
 * 写入 Agent 日志
 */
export const agentLogSchema = z.object({
  sessionId: z.string().min(1),
  agent: agentRoleSchema,
  level: logLevelSchema,
  message: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
