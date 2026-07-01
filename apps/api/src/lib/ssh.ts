/**
 * SSH 操作封装
 *
 * 用于：
 *   1. 测试用户服务器 SSH 连接
 *   2. 探测系统信息（OS / CPU / 内存 / 磁盘）
 *   3. 探测 Docker / Caddy 安装状态
 *   4. 执行受白名单限制的 SSH 命令（沙箱）
 *
 * 安全约束：
 *   - 命令白名单（SSH_SANDBOX.allowedCommands）
 *   - 路径黑名单（SSH_SANDBOX.blockedPaths）
 *   - 路径遍历检测（.. 检测）
 */
import { NodeSSH } from "node-ssh";

import {
  SSH_SANDBOX,
  type TestConnectionInput,
  type TestConnectionResponse,
} from "@lynxkit/shared";

import { logger } from "./logger.js";

/**
 * 解析命令首单词，校验是否在白名单中
 */
function validateCommand(command: string): void {
  const trimmed = command.trim();
  if (!trimmed) {
    throw new Error("命令不能为空");
  }
  // 取首个 token 作为命令名（去掉 sudo / env VAR=VAL 等前缀）
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
 * 校验路径不包含 .. 且不在黑名单目录下
 */
function validatePath(path: string): void {
  if (path.includes("..")) {
    throw new Error("路径不允许包含 ..（防止路径遍历）");
  }
  for (const blocked of SSH_SANDBOX.blockedPaths) {
    if (path === blocked || path.startsWith(`${blocked}/`)) {
      throw new Error(`路径 "${path}" 在黑名单中`);
    }
  }
}

/**
 * 测试 SSH 连接
 *
 * 流程：
 *   1. 用密码或私钥建立 SSH 连接
 *   2. 探测系统信息（uname / nproc / free -m / df -h）
 *   3. 探测 Docker 状态（docker --version / docker ps）
 *   4. 探测 Caddy 状态（caddy version）
 *
 * @param input SSH 连接凭证
 */
export async function testConnection(
  input: TestConnectionInput
): Promise<TestConnectionResponse> {
  const ssh = new NodeSSH();
  const startedAt = Date.now();

  logger.info(
    { ip: input.ip, port: input.port, username: input.username },
    "开始测试 SSH 连接"
  );

  try {
    await ssh.connect({
      host: input.ip,
      port: input.port,
      username: input.username,
      password: input.password,
      readyTimeout: 15000,
    });

    // 探测系统信息
    const osInfo = await execSafe(ssh, "uname -a");
    const cpuCores = parseIntOrNull(await execSafe(ssh, "nproc"));
    const memoryMB = parseFreeM(await execSafe(ssh, "free -m"));
    const diskGB = parseDiskGB(await execSafe(ssh, "df -h /"));

    // 探测 Docker 状态
    const dockerVersion = await execSafe(ssh, "docker --version");
    const dockerInstalled = !!dockerVersion && !dockerVersion.includes("not found");
    const dockerPsa = dockerInstalled
      ? await execSafe(ssh, "docker ps -a --format '{{.Names}}'")
      : "";

    // 探测 Caddy 状态
    const caddyVersion = await execSafe(ssh, "caddy version");
    const caddyInstalled = !!caddyVersion && !caddyVersion.includes("not found");

    const response: TestConnectionResponse = {
      success: true,
      message: "SSH 连接成功",
      osInfo: osInfo || null,
      dockerInstalled,
      dockerVersion: dockerInstalled ? dockerVersion.trim() : null,
      caddyInstalled,
      cpuCores: cpuCores ?? null,
      memoryMB: memoryMB ?? null,
      diskGB: diskGB ?? null,
    };

    logger.info(
      {
        ip: input.ip,
        durationMs: Date.now() - startedAt,
        dockerInstalled,
        caddyInstalled,
      },
      "SSH 连接测试成功"
    );

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn(
      { ip: input.ip, err: message, durationMs: Date.now() - startedAt },
      "SSH 连接测试失败"
    );

    return {
      success: false,
      message: `SSH 连接失败: ${message}`,
      dockerInstalled: false,
      caddyInstalled: false,
    };
  } finally {
    ssh.dispose();
  }
}

/**
 * 在已建立的 SSH 连接上检查 Docker 状态
 *
 * @param connection 已建立的 SSH 连接
 */
export async function checkDockerOnConnection(
  connection: NodeSSH
): Promise<{ ready: boolean; version: string | null }> {
  const version = await execSafe(connection, "docker --version");
  if (!version || version.includes("not found")) {
    return { ready: false, version: null };
  }

  // 检查 docker daemon 是否运行
  const ps = await execSafe(connection, "docker ps");
  const ready = !ps.includes("Cannot connect to the Docker daemon");

  return { ready, version: version.trim() };
}

/**
 * 执行受白名单限制的 SSH 命令（沙箱）
 *
 * @param connection 已建立的 SSH 连接
 * @param command 待执行命令
 * @param cwd 工作目录（会被路径校验）
 */
export async function execSandbox(
  connection: NodeSSH,
  command: string,
  cwd?: string
): Promise<{ stdout: string; stderr: string; code: number | null }> {
  validateCommand(command);
  if (cwd) {
    validatePath(cwd);
  }

  const result = await connection.execCommand(command, { cwd });
  return {
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    code: result.code,
  };
}

/**
 * 安全执行命令（不校验白名单，仅用于探测命令）
 *
 * 注意：仅供 testConnection 等只读探测使用，不要用于执行用户输入的命令。
 */
async function execSafe(ssh: NodeSSH, command: string): Promise<string> {
  try {
    const result = await ssh.execCommand(command);
    return (result.stdout ?? "").trim();
  } catch (err) {
    logger.debug(
      { command, err: err instanceof Error ? err.message : String(err) },
      "SSH 命令执行失败（探测忽略）"
    );
    return "";
  }
}

/**
 * 解析 free -m 输出，提取 Mem.total（MB）
 */
function parseFreeM(output: string): number | null {
  // 输出示例：
  //                total        used        free      shared  buff/cache   available
  // Mem:           7982        1234        4567         123        2181        6321
  // Swap:          2048           0        2048
  const match = output.match(/Mem:\s+(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * 解析 df -h / 输出，提取根分区大小（GB）
 */
function parseDiskGB(output: string): number | null {
  // 输出示例：
  // Filesystem      Size  Used Avail Use% Mounted on
  // /dev/sda1        50G   20G   30G  40% /
  const lines = output.split("\n").filter(Boolean);
  if (lines.length < 2) return null;
  const parts = lines[1].split(/\s+/);
  if (parts.length < 2) return null;
  const sizeStr = parts[1]; // 如 "50G"
  const match = sizeStr.match(/^(\d+)G$/i);
  return match ? parseInt(match[1], 10) : null;
}

function parseIntOrNull(value: string): number | null {
  if (!value) return null;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
}
