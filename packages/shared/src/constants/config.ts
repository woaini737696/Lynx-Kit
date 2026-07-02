/**
 * 平台常量 - LynxKit v1.0
 *
 * 限流 / 重试 / 超时等运行时配置。
 */

/**
 * 速率限制配置
 */
export const RATE_LIMIT = {
  /** 单 IP 限流 */
  perIp: {
    /** 每窗口最大请求数 */
    requests: 10,
    /** 窗口大小（秒） */
    windowSec: 60,
  },
  /** 单用户限流 */
  perUser: {
    /** 每窗口最大请求数 */
    requests: 100,
    /** 窗口大小（秒） */
    windowSec: 3600,
  },
} as const;

/**
 * 构建会话配置
 */
export const BUILD_CONFIG = {
  /** 单用户最大并发构建数 */
  maxConcurrentBuilds: 1,
  /** 会话空闲超时（分钟） */
  sessionTimeoutMin: 30,
  /** ⑨ 测试修复 Agent 最大重试轮数 */
  maxRetryRounds: 3,
  /** 单文件大小上限（字节，默认 50MB） */
  fileLimit: 1024 * 1024 * 50,
} as const;

/**
 * AI 调用配置
 */
export const AI_CONFIG = {
  /** 流式响应整体超时（毫秒，默认 5 分钟） */
  streamTimeoutMs: 300000,
  /** 单次请求最大 tokens */
  maxTokensPerRequest: 8192,
  /** 默认采样温度 */
  temperature: 0.3,
} as const;
