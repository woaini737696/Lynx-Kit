/**
 * 环境变量加载与校验 - LynxKit API
 *
 * 使用 Zod 在启动时对 process.env 做严格校验：
 *   - 缺失必需变量 → 进程退出并打印清晰错误
 *   - 类型不匹配 → 同上
 *   - 可选变量缺失 → 走默认值或 undefined
 *
 * 全局唯一入口，业务代码统一从 `env` 读取配置，禁止直接访问 process.env。
 */
import { z } from "zod";

const envSchema = z.object({
  /** 运行环境 */
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  /** HTTP 监听端口 */
  PORT: z.coerce.number().default(8787),
  /** PostgreSQL 连接字符串（本地 PG 或 Neon serverless） */
  DATABASE_URL: z.string().url(),
  /** Redis 连接字符串（可选，缺失时降级为内存限流与内存队列） */
  REDIS_URL: z.string().url().optional(),
  /** Better Auth 签名密钥（≥32 字符） */
  BETTER_AUTH_SECRET: z.string().min(32),
  /** Better Auth 公开 URL（如 https://api.lynxkit.com） */
  BETTER_AUTH_URL: z.string().url(),
  /** 允许的 CORS 来源（逗号分隔） */
  CORS_ORIGINS: z
    .string()
    .default("https://miaox.lynxdo.com,http://localhost:3000,http://localhost:5173,capacitor://localhost,http://localhost"),
  /** KMS 主密钥（AES-256-GCM，64 位十六进制 = 32 字节） */
  KMS_MASTER_KEY: z.string().min(64),

  // ===== AI 模型 API Key（可选，用户在系统设置中也可运行时填写） =====
  /** DeepSeek API Key */
  DEEPSEEK_API_KEY: z.string().optional(),
  /** Kimi（月之暗面）API Key */
  KIMI_API_KEY: z.string().optional(),
  /** 豆包（字节）API Key */
  DOUBAO_API_KEY: z.string().optional(),
  /** 通义千问 API Key */
  QWEN_API_KEY: z.string().optional(),
  /** 智谱 GLM API Key */
  GLM_API_KEY: z.string().optional(),

  // ===== 可选第三方服务 =====
  /** Upstash Redis REST URL（用于分布式限流；缺失则降级为内存限流） */
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  /** Upstash Redis REST Token */
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  /** Sentry DSN（缺失则不上报） */
  SENTRY_DSN: z.string().url().optional(),

  // ===== 监控（迭代 14E） =====
  /** 是否启用 Prometheus /metrics 端点（默认 true） */
  PROMETHEUS_ENABLED: z.coerce.boolean().default(true),
});

/**
 * 解析后的环境变量对象。
 *
 * 解析失败时 Zod 会抛出 ZodError，包含每个字段的详细错误信息，
 * 此处捕获后输出友好日志并退出进程，避免带着错误配置启动。
 */
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ 环境变量校验失败：");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;

/**
 * CORS 来源数组（解析逗号分隔字符串）
 */
export const corsOrigins: string[] = env.CORS_ORIGINS.split(",")
  .map((s) => s.trim())
  .filter(Boolean);
