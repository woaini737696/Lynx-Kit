import { z } from "zod";

/**
 * 产品类型枚举（与文档 §3.2 对应）
 */
export const ProjectTypeSchema = z.enum([
  "static-site",
  "service-booking",
  "content-publish",
  "light-commerce",
  "event-manage",
  "admin-dashboard",
]);
export type ProjectType = z.infer<typeof ProjectTypeSchema>;

/**
 * 项目状态枚举
 * - draft: 草稿（刚创建）
 * - clarifying: 需求澄清中
 * - generating: 代码生成中
 * - building: 编译中
 * - deploying: 部署中
 * - deployed: 已部署
 * - error: 错误
 */
export const ProjectStatusSchema = z.enum([
  "draft",
  "clarifying",
  "generating",
  "building",
  "deploying",
  "deployed",
  "error",
]);
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

/**
 * 用户产品项目 Schema
 */
export const ProjectSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  serverId: z.string().cuid(),
  name: z.string().min(1).max(100),
  type: ProjectTypeSchema,
  // 用户回答生成的 JSON 配置
  config: z.record(z.unknown()).default({}),
  status: ProjectStatusSchema.default("draft"),
  // 平台分配的子域名
  domain: z.string().nullable().optional(),
  // 用户自定义域名
  customDomain: z.string().nullable().optional(),
  // 版本号
  version: z.number().int().default(1),
  // 部署 URL
  deployUrl: z.string().url().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Project = z.infer<typeof ProjectSchema>;

/**
 * 创建项目输入
 */
export const CreateProjectInputSchema = z.object({
  name: z.string().min(1, "请输入项目名称").max(100),
  type: ProjectTypeSchema,
  serverId: z.string().cuid(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectInputSchema>;

/**
 * 更新项目配置输入
 */
export const UpdateProjectConfigInputSchema = z.object({
  config: z.record(z.unknown()),
});

export type UpdateProjectConfigInput = z.infer<
  typeof UpdateProjectConfigInputSchema
>;

/**
 * 项目版本 Schema（用于回滚）
 */
export const ProjectVersionSchema = z.object({
  id: z.string().cuid(),
  projectId: z.string().cuid(),
  version: z.number().int(),
  config: z.record(z.unknown()),
  codeHash: z.string(),
  createdAt: z.string().datetime(),
});

export type ProjectVersion = z.infer<typeof ProjectVersionSchema>;
