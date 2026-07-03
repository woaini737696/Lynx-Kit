/**
 * SSH 命令沙箱白名单
 *
 * 用于 @lynxkit/deployer 在执行远程命令前做白名单校验，
 * 防止注入任意命令。原则：仅允许部署链路必需的命令。
 */

export interface SSHSandboxConfig {
  /** 允许执行的命令首单词（小写匹配） */
  allowedCommands: readonly string[];
  /** 拒绝的路径片段（出现即拒绝） */
  blockedPaths: readonly string[];
}

export const SSH_SANDBOX: SSHSandboxConfig = {
  allowedCommands: [
    // 系统信息
    "uname",
    "whoami",
    "hostname",
    "uptime",
    "df",
    "free",
    "ls",
    "cat",
    "echo",
    "date",
    // 包管理（apt 系）
    "apt",
    "apt-get",
    "dpkg",
    // 进程管理
    "systemctl",
    "journalctl",
    "pm2",
    "pgrep",
    "pkill",
    "ps",
    // 文件操作
    "mkdir",
    "cp",
    "mv",
    "rm",
    "chmod",
    "chown",
    "tar",
    "gzip",
    "gunzip",
    "unzip",
    "touch",
    "stat",
    "test",
    // 网络探测
    "curl",
    "wget",
    "ping",
    "ss",
    "netstat",
    // 文本处理（部署日志解析）
    "grep",
    "awk",
    "sed",
    "head",
    "tail",
    "wc",
    "sort",
    "uniq",
    // Node.js 运行时
    "node",
    "npm",
    "pnpm",
    "npx",
    // Git
    "git",
    // nginx
    "nginx",
  ],
  blockedPaths: [
    "/etc/shadow",
    "/etc/passwd",
    "/root/.ssh",
    "/home",
    "/.ssh",
    "/etc/letsencrypt",
    "/var/log/auth.log",
  ],
} as const;
