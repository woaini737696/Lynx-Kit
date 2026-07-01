import { z } from "zod";

/**
 * 服务器状态枚举
 * - pending: 待验证（刚添加，未测试连接）
 * - connected: 已连接（SSH 测试通过）
 * - docker_ready: Docker 已就绪
 * - caddy_ready: Caddy 已就绪
 * - error: 连接异常
 */
export const ServerStatusSchema = z.enum([
  "pending",
  "connected",
  "docker_ready",
  "caddy_ready",
  "error",
]);
export type ServerStatus = z.infer<typeof ServerStatusSchema>;

/**
 * 用户服务器 Schema（SSH 凭证已加密存储）
 */
export const ServerSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  name: z.string().min(1).max(50),
  ip: z.string().ip(),
  port: z.number().int().min(1).max(65535).default(22),
  username: z.string().min(1).max(50),
  // 加密后的密码（AES-256-GCM）
  encryptedPassword: z.string(),
  // 可选 SSH 密钥（加密）
  sshKey: z.string().nullable().optional(),
  status: ServerStatusSchema.default("pending"),
  dockerReady: z.boolean().default(false),
  caddyReady: z.boolean().default(false),
  // 系统信息（连接后自动探测）
  osInfo: z.string().nullable().optional(),
  cpuCores: z.number().nullable().optional(),
  memoryMB: z.number().nullable().optional(),
  diskGB: z.number().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Server = z.infer<typeof ServerSchema>;

/**
 * 创建服务器输入
 */
export const CreateServerInputSchema = z.object({
  name: z.string().min(1, "请输入服务器名称").max(50),
  ip: z.string().ip("IP 地址格式不正确"),
  port: z.number().int().min(1).max(65535).default(22),
  username: z.string().min(1, "请输入用户名").max(50),
  password: z.string().min(1, "请输入密码"),
  sshKey: z.string().optional(),
});

export type CreateServerInput = z.infer<typeof CreateServerInputSchema>;

/**
 * SSH 测试连接请求
 */
export const TestConnectionInputSchema = z.object({
  ip: z.string().ip(),
  port: z.number().int().min(1).max(65535).default(22),
  username: z.string().min(1),
  password: z.string().min(1),
});

export type TestConnectionInput = z.infer<typeof TestConnectionInputSchema>;

/**
 * SSH 测试连接响应
 */
export const TestConnectionResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  // 连接成功时返回的探测信息
  osInfo: z.string().nullable().optional(),
  dockerInstalled: z.boolean().default(false),
  dockerVersion: z.string().nullable().optional(),
  caddyInstalled: z.boolean().default(false),
  cpuCores: z.number().nullable().optional(),
  memoryMB: z.number().nullable().optional(),
  diskGB: z.number().nullable().optional(),
});

export type TestConnectionResponse = z.infer<typeof TestConnectionResponseSchema>;
