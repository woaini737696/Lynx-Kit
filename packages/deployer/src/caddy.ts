/**
 * Caddy 反向代理 + 自动 SSL 配置
 *
 * Caddy 自动申请并续期 Let's Encrypt 证书，无需人工配置。
 * 本模块负责为每个项目生成 Caddyfile 片段，并 reload Caddy。
 *
 * 流程：
 *   1. 生成 /etc/caddy/sites/<projectId>.caddy 文件
 *   2. 在主 Caddyfile 中 include /etc/caddy/sites/*
 *   3. caddy validate 校验配置
 *   4. caddy reload 热加载
 *
 * 安全约束：
 *   - 仅能写入 /etc/caddy/sites/ 目录
 *   - caddy reload 走 execSandbox 白名单
 *   - 域名格式校验（拒绝 IP / 内网域名 / 特殊字符）
 */
import type { NodeSSH } from "node-ssh";

export interface CaddySiteConfig {
  /** 项目 ID */
  projectId: string;
  /** 用户域名（如 example.com） */
  domain: string;
  /** 后端服务地址（如 127.0.0.1:3000） */
  upstream: string;
  /** 是否启用 HTTPS（默认 true） */
  enableHttps?: boolean;
  /** 自定义响应头 */
  headers?: Record<string, string>;
}

export interface CaddyReloadResult {
  success: boolean;
  /** 配置校验结果 */
  validated: boolean;
  /** reload 耗时（毫秒） */
  durationMs: number;
  /** 错误消息 */
  error?: string;
}

/**
 * 校验域名格式
 *
 * 拒绝：
 *   - IP 地址
 *   - 内网域名（.local / .internal / .lan）
 *   - 包含特殊字符
 *   - 长度超过 253
 */
export function validateDomain(domain: string): boolean {
  if (!domain || domain.length > 253) return false;
  // 拒绝 IP
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(domain)) return false;
  // 拒绝内网域名
  if (/\.(local|internal|lan|localhost)$/i.test(domain)) return false;
  // 域名格式校验
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(
    domain
  );
}

/**
 * 生成单个站点的 Caddyfile 配置片段
 *
 * 示例输出（启用 HTTPS）：
 *   example.com {
 *     reverse_proxy 127.0.0.1:3000
 *     header {
 *       X-Frame-Options DENY
 *       X-Content-Type-Options nosniff
 *     }
 *   }
 *
 * 示例输出（禁用 HTTPS，纯 HTTP）：
 *   :80 {
 *     reverse_proxy 127.0.0.1:3000
 *   }
 */
export function generateCaddyfile(config: CaddySiteConfig): string {
  const host =
    config.enableHttps === false ? `:80` : config.domain;
  const lines: string[] = [`${host} {`];

  // 反向代理
  lines.push(`  reverse_proxy ${config.upstream}`);

  // 自定义响应头
  if (config.headers) {
    lines.push("  header {");
    for (const [key, value] of Object.entries(config.headers)) {
      lines.push(`    ${key} ${value}`);
    }
    lines.push("  }");
  }

  lines.push("}");
  return lines.join("\n");
}

/**
 * 写入站点配置并 reload Caddy
 *
 * TODO: Week 4 完整实现
 */
export async function configureSite(
  connection: NodeSSH,
  config: CaddySiteConfig
): Promise<CaddyReloadResult> {
  if (!validateDomain(config.domain)) {
    return {
      success: false,
      validated: false,
      durationMs: 0,
      error: `域名 "${config.domain}" 格式不合法`,
    };
  }

  void connection;
  // TODO: Week 4
  // 1. 生成 Caddyfile 内容
  // 2. SFTP 写入 /etc/caddy/sites/<projectId>.caddy
  // 3. caddy validate --config /etc/caddy/Caddyfile
  // 4. caddy reload --config /etc/caddy/Caddyfile
  // 5. 返回结果
  throw new Error("[Week 1 占位] Caddy configureSite 未实现");
}

/**
 * 移除站点配置（项目删除时调用）
 *
 * TODO: Week 4 完整实现
 */
export async function removeSite(
  connection: NodeSSH,
  projectId: string
): Promise<CaddyReloadResult> {
  void connection;
  void projectId;
  // TODO: Week 4 - rm /etc/caddy/sites/<projectId>.caddy && caddy reload
  throw new Error("[Week 1 占位] Caddy removeSite 未实现");
}
