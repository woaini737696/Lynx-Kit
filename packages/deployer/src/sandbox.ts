/**
 * Docker 沙箱（用于 ⑤ 编译测试 Agent）
 *
 * 在临时容器内执行 npm run build，构建后销毁容器。
 *
 * 资源限制（与产品文档 §10 安全架构 对应）：
 *   - CPU: 1 核（--cpus=1）
 *   - 内存: 1GB（--memory=1g）
 *   - 超时: 5 分钟（--timeout=300s）
 *   - 网络: 无（--network=none，仅构建不需要外网）
 *   - 文件系统: 只读 rootfs（--read-only），仅 /tmp 可写
 *   - 权限: 非 root（--user 1000:1000）+ --security-opt=no-new-privileges
 *   - seccomp: 默认 profile 阻止 ptrace / mount / setuid
 *
 * 用于 ⑤ 编译测试 Agent 在隔离环境验证生成的代码包能否构建。
 */

export interface SandboxBuildInput {
  /** 项目 ID */
  projectId: string;
  /** 构建目录（相对挂载点） */
  workDir: string;
  /** 基础镜像（默认 node:20-alpine） */
  baseImage?: string;
  /** 构建命令（默认 npm run build） */
  buildCommand?: string;
  /** 超时（毫秒），默认 5 分钟 */
  timeoutMs?: number;
  /** 内存上限（字节），默认 1GB */
  memoryBytes?: number;
  /** CPU 核数，默认 1 */
  cpus?: number;
}

export interface SandboxBuildResult {
  /** 是否构建成功 */
  success: boolean;
  /** 退出码 */
  exitCode: number | null;
  /** 标准输出 */
  stdout: string;
  /** 标准错误 */
  stderr: string;
  /** 构建耗时（毫秒） */
  durationMs: number;
  /** 容器 ID（用于清理） */
  containerId?: string;
}

/**
 * 在 Docker 沙箱内执行构建
 *
 * 流程：
 *   1. docker create 启动临时容器（带资源限制参数）
 *   2. docker cp 拷贝代码包到容器 /app
 *   3. docker start 启动容器并执行 buildCommand
 *   4. 等待容器退出或超时
 *   5. docker logs 读取输出
 *   6. docker rm 销毁容器（无论成功失败）
 *
 * TODO: Week 3 完整实现
 */
export async function runBuildInSandbox(
  input: SandboxBuildInput
): Promise<SandboxBuildResult> {
  void input;
  // TODO: Week 3
  // 1. docker create --rm \
  //      --cpus=1 --memory=1g \
  //      --network=none --read-only \
  //      --user 1000:1000 \
  //      --security-opt=no-new-privileges \
  //      --tmpfs /tmp:rw,size=256m \
  //      -w /app \
  //      node:20-alpine \
  //      sh -c "npm ci --ignore-scripts && npm run build"
  // 2. docker cp <build-dir>/. <container>:/app
  // 3. docker start -a <container>
  // 4. 捕获超时（5min 后 docker kill）
  // 5. 返回 stdout/stderr/exitCode
  throw new Error("[Week 1 占位] sandbox runBuildInSandbox 未实现");
}

/**
 * 强制清理沙箱容器
 *
 * 如果 Agent 异常退出，残留容器需要主动清理。
 *
 * TODO: Week 3 完整实现
 */
export async function cleanupSandbox(containerId: string): Promise<void> {
  void containerId;
  // TODO: Week 3 - docker rm -f <containerId>
}

/**
 * 预检沙箱环境
 *
 * 校验本机 Docker daemon 是否可用，是否能拉取基础镜像。
 *
 * TODO: Week 3 完整实现
 */
export async function preflightSandbox(
  baseImage?: string
): Promise<{ ready: boolean; version?: string; error?: string }> {
  void baseImage;
  // TODO: Week 3 - docker version && docker pull <baseImage>
  return { ready: false };
}
