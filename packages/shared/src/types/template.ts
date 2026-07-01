import { z } from "zod";

/**
 * 模板问题类型枚举
 */
export const QuestionTypeSchema = z.enum([
  "text",
  "textarea",
  "select",
  "multi-select",
  "color-select",
  "time-range",
  "number",
  "image",
]);
export type QuestionType = z.infer<typeof QuestionTypeSchema>;

/**
 * 模板问题 Schema（与文档 §4.3 对应）
 */
export const TemplateQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  type: QuestionTypeSchema,
  required: z.boolean().default(true),
  placeholder: z.string().optional(),
  default: z.unknown().optional(),
  options: z.array(z.union([z.string(), z.object({ label: z.string(), value: z.string() })])).optional(),
});

export type TemplateQuestion = z.infer<typeof TemplateQuestionSchema>;

/**
 * 模板元数据 Schema（template.json 标准格式）
 */
export const TemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  architecture: z.string(),
  version: z.string().default("1.0.0"),
  features: z.array(z.string()).default([]),
  screenshots: z.array(z.string()).default([]),
  questions: z.array(TemplateQuestionSchema),
  // 配置映射规则
  configMapping: z.record(z.string()).default({}),
});

export type Template = z.infer<typeof TemplateSchema>;

/**
 * 模板列表项 Schema
 */
export const TemplateListItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string(),
  features: z.array(z.string()),
  isActive: z.boolean(),
});

export type TemplateListItem = z.infer<typeof TemplateListItemSchema>;
