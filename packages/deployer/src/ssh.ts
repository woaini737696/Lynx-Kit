/**
 * SSH 操作封装
 *
 * 用于部署阶段的文件上传、远程命令执行。
 * 与 apps/api/src/lib/ssh.ts 的 testConnection 不同，本模块面向部署执行。
 *
 * 安全约束：
 *   - 所有命令走白名单校验（@lynxkit/shared 的 SSH_SANDBOX.allowedCommands）
 *   - 上传路径禁止 ..（路径遍历检测）
 *   - SSH 凭证从 KMS 解密读取，不落盘明文
 *   - 连接超时 15s，命令超时 5min
 */
import type { NodeSSH } from "node-ssh";

import { SSH_SANDBOX } from "@lynxkit/shared";

/**
 * SSH 连接配置（凭证已解密）
 */
export interface SSHConnectionOptions {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
  readyTimeout?: number;
}

export interface UploadFile {
  /** 远程相对路径（基于项目根目录） */
  remotePath: string;
  /** 文件内容 */
  content: string | Buffer;
}

export interface UploadResult {
  /** 已上传文件数 */
  uploaded: number;
  /** 上传耗时（毫秒） */
  durationMs: number;
  /** 远程项目根目录 */
  remoteBaseDir: string;
}

export interface ExecResult {
  stdout: string;
  stderr: string;
  code: number | null;
  /** 命令执行耗时（毫秒） */
  durationMs: number;
}

/**
 * 建立 SSH 连接
 *
 * TODO: Week 4 完整实现
 */
export async function connect(
  options: SSHConnectionOptions
): Promise<NodeSSH> {
  // TODO: Week 4
  // 1. 使用 node-ssh 建立连接
  // 2. readyTimeout 默认 15000
  // 3. 连接失败抛出 SSHError
  void options;
  throw new Error("[Week 1 占位] SSH connect 未实现");
}

/**
 * 上传文件到远程服务器
 *
 * 安全策略：
 *   - 校验 remotePath 不包含 ..
 *   - 每个项目独立目录 /opt/lynxkit-projects/<projectId>/
 *   - 上传前自动创建目标目录
 *
 * TODO: Week 4 完整实现
 */
export async function uploadFiles(
  connection: NodeSSH,
  projectId: string,
  files: UploadFile[]
): Promise<UploadResult> {
  // TODO: Week 4
  // 1. 校验所有 remotePath 不含 ..
  // 2. 创建 /opt/lynxkit-projects/<projectId>/
  // 3. 用 connection.putBuffer 批量上传
  // 4. 返回上传结果
  void connection;
  void projectId;
  void files;
  throw new Error("[Week 1 占位] SSH uploadFiles 未实现");
}

/**
 * 在远程服务器执行白名单命令
 *
 * 命令首单词必须在 SSH_SANDBOX.allowedCommands 中。
 * 不允许 sudo / nohup / rm -rf 等危险操作。
 *
 * TODO: Week 4 完整实现
 */
export async function execSandbox(
  connection: NodeSSH,
  command: string,
  cwd?: string,
  timeoutMs = 300_000
): Promise<ExecResult> {
  validateCommand(command);
  if (cwd) {
    validatePath(cwd);
  }
  void connection;
  void timeoutMs;
  // TODO: Week 4 - 调用 connection.execCommand(command, { cwd, execOptions: { timeout } })
  throw new Error("[Week 1 占位] SSH execSandbox 未实现");
}

/**
 * 命令白名单校验
 *
 * 取首个 token，跳过 sudo / nohup / VAR=val 前缀，
 * 校验是否在 SSH_SANDBOX.allowedCommands 中。
 */
export function validateCommand(command: string): void {
  const trimmed = command.trim();
  if (!trimmed) {
    throw new Error("命令不能为空");
  }
  const tokens = trimmed.split(/\s+/);
  let cmd = tokens[0];
  while (cmd === "sudo" || cmd === "nohup" || cmd.includes("=")) {
    tokens.shift();
    cmd = tokens[0] ?? "";
  }
  if (!SSH_SANDBOX.allowedCommands.includes(cmd)) {
    throw new Error(`命令 "${cmd}" 不在白名单中`);
  }
}

/**
 * 路径校验（拒绝 .. 遍历 + 黑名单目录）
 */
export function validatePath(path: string): void {
  if (path.includes("..")) {
    throw new Error("路径不允许包含 ..（防止路径遍历）");
  }
  for (const blocked of SSH_SANDBOX.blockedPaths) {
    if (path === blocked || path.startsWith(`${blocked}/`)) {
      throw new Error(`路径 "${path}" 在黑名单中`);
    }
  }
}
