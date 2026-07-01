/**
 * 平台全局配置常量
 */

export const APP_CONFIG = {
  /** 平台名称 */
  name: "LynxKit",
  /** 平台 slogan */
  tagline: "人人都是超级个体",
  /** 平台默认域名 */
  defaultDomain: "lynx.run",
  /** 平台默认部署根目录（用户服务器上） */
  projectRoot: "/opt/lynx/projects",
  /** 平台默认存储目录 */
  storageRoot: "/opt/lynx/storage",
  /** 备份目录 */
  backupRoot: "/opt/lynx/backups",
  /** 单次部署最大耗时（秒） */
  deployTimeout: 300,
  /** L1 修复最大重试次数 */
  maxFixRetries: 3,
  /** L2 引导修复最大重试次数 */
  maxGuidedFixRetries: 2,
} as const;

/**
 * 端口配置
 */
export const PORTS = {
  api: 4000,
  web: 3000,
  postgres: 5432,
  redis: 6379,
} as const;

/**
 * 文件上传限制
 */
export const UPLOAD_LIMITS = {
  /** 最大文件大小（字节） */
  maxFileSize: 5 * 1024 * 1024, // 5MB
  /** 允许的图片类型 */
  allowedImageTypes: ["image/jpeg", "image/png", "image/webp"],
  /** 允许的图片扩展名 */
  allowedImageExtensions: [".jpg", ".jpeg", ".png", ".webp"],
} as const;

/**
 * 队列名称
 */
export const QUEUE_NAMES = {
  codeGeneration: "code-generation",
  deployment: "deployment",
  buildSandbox: "build-sandbox",
  notifications: "notifications",
} as const;

/**
 * JWT 配置
 */
export const JWT_CONFIG = {
  algorithm: "HS256" as const,
  issuer: "lynxkit",
  audience: "lynxkit-users",
  expiresIn: "7d",
  /** Access token 有效期 */
  accessTokenExpiresIn: "1h",
  /** Refresh token 有效期 */
  refreshTokenExpiresIn: "30d",
};

/**
 * 限流配置
 */
export const RATE_LIMIT = {
  /** 单 IP 每分钟最大请求数 */
  maxPerMinute: 60,
  /** 登录接口每分钟最大尝试 */
  loginMaxPerMinute: 10,
  /** 注册接口每分钟最大尝试 */
  registerMaxPerHour: 5,
} as const;

/**
 * SSH 沙箱命令白名单（与文档 §10.3 对应）
 */
export const SSH_SANDBOX = {
  allowedCommands: [
    "docker",
    "docker-compose",
    "git",
    "node",
    "npm",
    "pnpm",
    "mkdir",
    "cp",
    "mv",
    "rm",
    "chmod",
    "ls",
    "cat",
    "curl",
  ],
  blockedPaths: ["/etc", "/usr", "/var", "/root", "/home"],
  projectRoot: APP_CONFIG.projectRoot,
} as const;
