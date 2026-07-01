/**
 * Docker Compose 操作封装
 *
 * 用于在远程服务器上：
 *   1. 构建镜像（docker compose build）
 *   2. 启动容器（docker compose up -d）
 *   3. 停止容器（docker compose down）
 *   4. 查询容器状态（docker compose ps）
 *   5. 查看容器日志（docker compose logs）
 *
 * 所有命令通过 SSH 沙箱执行，不允许本地 docker 直接调用。
 */
import type { NodeSSH } from "node-ssh";

export interface ComposeUpOptions {
  /** 项目 ID */
  projectId: string;
  /** 远程项目根目录 */
  remoteBaseDir: string;
  /** 是否强制重新构建（--build） */
  build?: boolean;
  /** 是否后台运行（-d），默认 true */
  detached?: boolean;
  /** 服务名（不指定则启动所有服务） */
  services?: string[];
  /** 超时（毫秒） */
  timeoutMs?: number;
}

export interface ComposeResult {
  success: boolean;
  /** 输出日志 */
  logs: string;
  /** 启动的容器名 */
  containers: string[];
  /** 构建耗时（毫秒） */
  durationMs: number;
}

export interface ContainerStatus {
  name: string;
  state: "running" | "exited" | "paused" | "restarting";
  status: string;
  ports: string[];
}

/**
 * 构建 + 启动 docker compose
 *
 * 命令：
 *   docker compose build [services...]
 *   docker compose up -d [services...]
 *
 * TODO: Week 4 完整实现
 */
export async function composeUp(
  connection: NodeSSH,
  options: ComposeUpOptions
): Promise<ComposeResult> {
  void connection;
  void options;
  // TODO: Week 4
  // 1. cd remoteBaseDir
  // 2. docker compose build --pull
  // 3. docker compose up -d
  // 4. docker compose ps --format '{{.Name}} {{.State}}'
  // 5. 校验所有容器都是 running 状态
  throw new Error("[Week 1 占位] docker composeUp 未实现");
}

/**
 * 停止并移除容器（docker compose down）
 *
 * TODO: Week 4 完整实现
 */
export async function composeDown(
  connection: NodeSSH,
  remoteBaseDir: string,
  options?: { removeVolumes?: boolean; timeoutMs?: number }
): Promise<ComposeResult> {
  void connection;
  void remoteBaseDir;
  void options;
  // TODO: Week 4
  throw new Error("[Week 1 占位] docker composeDown 未实现");
}

/**
 * 查询容器状态（docker compose ps）
 *
 * TODO: Week 4 完整实现
 */
export async function composePs(
  connection: NodeSSH,
  remoteBaseDir: string
): Promise<ContainerStatus[]> {
  void connection;
  void remoteBaseDir;
  // TODO: Week 4
  // docker compose ps --format '{{json .}}'
  // 解析为 ContainerStatus[]
  return [];
}

/**
 * 拉取容器日志（docker compose logs --tail N）
 *
 * TODO: Week 4 完整实现
 */
export async function composeLogs(
  connection: NodeSSH,
  remoteBaseDir: string,
  options?: { tail?: number; service?: string }
): Promise<string> {
  void connection;
  void remoteBaseDir;
  void options;
  // TODO: Week 4
  return "";
}

/**
 * 检查远程服务器 Docker 环境
 *
 * - docker --version
 * - docker compose version
 * - docker info（daemon 是否运行）
 *
 * TODO: Week 4 完整实现
 */
export async function checkDockerEnv(
  connection: NodeSSH
): Promise<{
  installed: boolean;
  composeInstalled: boolean;
  daemonRunning: boolean;
  version?: string;
}> {
  void connection;
  // TODO: Week 4 - 通过 execSandbox 跑 docker --version 等
  return {
    installed: false,
    composeInstalled: false,
    daemonRunning: false,
  };
}
