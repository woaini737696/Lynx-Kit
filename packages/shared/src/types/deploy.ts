import { z } from "zod";

/**
 * 部署日志状态枚举
 */
export const DeployStatusSchema = z.enum(["pending", "success", "failed"]);
export type DeployStatus = z.infer<typeof DeployStatusSchema>;

/**
 * 部署日志 Schema
 */
export const DeployLogSchema = z.object({
  id: z.string().cuid(),
  projectId: z.string().cuid(),
  status: DeployStatusSchema.default("pending"),
  logs: z.string().default(""),
  duration: z.number().nullable().optional(),
  error: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
});

export type DeployLog = z.infer<typeof DeployLogSchema>;

/**
 * 触发部署输入
 */
export const DeployInputSchema = z.object({
  projectId: z.string().cuid(),
  // 是否强制重新生成代码
  regenerate: z.boolean().default(false),
});

export type DeployInput = z.infer<typeof DeployInputSchema>;

/**
 * 部署任务状态
 */
export const DeployJobStatusSchema = z.enum([
  "queued",
  "uploading",
  "building",
  "starting",
  "configuring",
  "health_checking",
  "completed",
  "failed",
]);

export type DeployJobStatus = z.infer<typeof DeployJobStatusSchema>;

/**
 * 部署进度事件
 */
export const DeployProgressEventSchema = z.object({
  jobId: z.string(),
  status: DeployJobStatusSchema,
  progress: z.number().min(0).max(100),
  message: z.string(),
  timestamp: z.string().datetime(),
});

export type DeployProgressEvent = z.infer<typeof DeployProgressEventSchema>;
