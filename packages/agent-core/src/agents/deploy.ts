import type { GeneratedFile } from "./fill.js";

/**
 * ⑦ 部署 Agent
 *
 * 输入：构建产物 + 目标服务器
 * 输出：部署结果（访问地址、状态）
 *
 * 实现（与产品文档 §10 安全架构 对应）：
 *   1. SSH 上传代码包到目标服务器 /opt/lynxkit-projects/<projectId>/
 *   2. 服务器端执行 docker compose build && docker compose up -d
 *   3. 配置 Caddy 反向代理 + 自动 SSL 证书
 *   4. 健康检查（轮询 GET / 直到 200 OK）
 *   5. 写入部署日志到数据库
 *
 * 安全约束：
 *   - 所有 SSH 命令走白名单校验
 *   - 上传文件经过路径校验（拒绝 .. 遍历）
 *   - 部署目录隔离（每个项目独立子目录）
 *   - SSH 凭证从 KMS 解密读取，不落盘明文
 *
 * 由 packages/deployer 实现 SSH / Docker / Caddy 三大能力，本 Agent 负责调度编排。
 */

export interface DeployInput {
  /** 项目 ID */
  projectId: string;
  /** 构建产物（文件列表） */
  files: GeneratedFile[];
  /** 目标服务器 ID（关联 Server 表） */
  serverId: string;
  /** 用户域名（用于 Caddy 反代 + SSL） */
  domain?: string;
  /** 是否启用 HTTPS（默认 true） */
  enableHttps?: boolean;
  /** 端口号（Caddy 入口端口，默认 80） */
  port?: number;
}

export type DeployStatus =
  | "uploading"
  | "building"
  | "starting"
  | "configuring_caddy"
  | "health_checking"
  | "success"
  | "failed";

export interface DeployOutput {
  /** 部署状态 */
  status: DeployStatus;
  /** 访问地址（成功后填充） */
  url?: string;
  /** 容器名称列表 */
  containers?: string[];
  /** 部署耗时（毫秒） */
  durationMs: number;
  /** 失败时的错误消息 */
  error?: string;
  /** 部署日志（每步的关键输出） */
  logs: DeployLogEntry[];
}

export interface DeployLogEntry {
  /** 步骤 */
  step: DeployStatus | "pre_check";
  /** 时间戳（ISO 8601） */
  timestamp: string;
  /** 消息 */
  message: string;
  /** 详细日志 */
  detail?: string;
}

/**
 * 部署 Agent
 *
 * 调度 packages/deployer 完成上传 → 构建 → 启动 → 配置 → 健康检查。
 *
 * TODO: Week 4 完整实现
 */
export async function deployProject(
  input: DeployInput
): Promise<DeployOutput> {
  // TODO: Week 4 完整实现
  // 1. 从 Server 表读取服务器凭证（KMS 解密）
  // 2. 调用 deployer.uploadFiles() 上传代码包
  // 3. 调用 deployer.dockerComposeBuild() 构建镜像
  // 4. 调用 deployer.dockerComposeUp() 启动容器
  // 5. 调用 deployer.configureCaddy() 配置反代 + SSL
  // 6. 调用 deployer.healthCheck() 轮询健康检查
  // 7. 写入 DeployLog 表
  void input;

  return {
    status: "success",
    url: undefined,
    containers: [],
    durationMs: 0,
    logs: [
      {
        step: "pre_check",
        timestamp: new Date().toISOString(),
        message: "[Week 1 占位] 部署 Agent 未实际执行",
      },
    ],
  };
}

/**
 * 回滚部署
 *
 * docker compose down && 恢复上一可用版本镜像。
 *
 * TODO: Week 4 实现
 */
export async function rollbackDeploy(
  projectId: string,
  previousVersion?: string
): Promise<DeployOutput> {
  void projectId;
  void previousVersion;

  return {
    status: "success",
    durationMs: 0,
    logs: [
      {
        step: "pre_check",
        timestamp: new Date().toISOString(),
        message: "[Week 1 占位] 回滚未实际执行",
      },
    ],
  };
}
