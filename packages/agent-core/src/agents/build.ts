import type { GeneratedFile } from "./fill.js";

/**
 * ⑤ 编译测试 Agent
 *
 * 输入：项目代码包
 * 输出：编译结果（成功/失败）+ 错误日志
 *
 * 实现：在 Docker 沙箱内执行 npm run build
 *   - 临时容器（构建后销毁）
 *   - 资源限制（CPU 1 核，内存 1GB，超时 5 分钟）
 *   - 隔离：read-only rootfs + seccomp
 *
 * 由 packages/deployer/sandbox.ts 实现沙箱，本 Agent 负责调度
 */

export interface BuildInput {
  /** 项目 ID */
  projectId: string;
  /** 项目代码包 */
  files: GeneratedFile[];
  /** 项目类型（决定构建命令） */
  projectType: string;
  /** 超时（毫秒），默认 5 分钟 */
  timeoutMs?: number;
}

export interface BuildError {
  /** 错误类型 */
  type:
    | "compile_error"
    | "dependency_error"
    | "type_error"
    | "syntax_error"
    | "import_error"
    | "runtime_error"
    | "timeout"
    | "unknown";
  /** 错误消息 */
  message: string;
  /** 错误所在的文件路径 */
  filePath?: string;
  /** 错误所在的行号 */
  line?: number;
  /** 错误所在的列号 */
  column?: number;
  /** 原始错误日志 */
  rawLog?: string;
}

export interface BuildOutput {
  /** 是否编译成功 */
  success: boolean;
  /** 编译耗时（毫秒） */
  durationMs: number;
  /** 构建产物大小（字节） */
  artifactSize?: number;
  /** 错误列表（success=false 时填充） */
  errors: BuildError[];
  /** 完整构建日志 */
  logs: string;
}

/**
 * 编译测试 Agent
 *
 * 调用 packages/deployer/sandbox.ts 在 Docker 沙箱内执行构建。
 *
 * TODO: Week 3 完整实现
 */
export async function buildProject(input: BuildInput): Promise<BuildOutput> {
  // TODO: Week 3 完整实现
  // 1. 创建临时容器（基于 node:20-alpine）
  // 2. 将 files 写入容器 /app 目录
  // 3. 执行 npm install && npm run build
  // 4. 解析构建日志，提取错误信息
  // 5. 返回 BuildOutput

  return {
    success: true,
    durationMs: 0,
    errors: [],
    logs: "[Build Agent] Week 1 占位，未实际执行构建",
  };
}

/**
 * 错误日志解析器
 *
 * 将原始构建日志解析为结构化的 BuildError 数组。
 * 支持解析：
 *   - TypeScript 编译错误
 *   - ESLint 错误
 *   - Next.js 构建错误
 *   - 依赖缺失错误
 *
 * TODO: Week 3 实现完整解析器
 */
export function parseBuildErrors(rawLog: string): BuildError[] {
  const errors: BuildError[] = [];
  // TODO: 实现 TypeScript 错误正则匹配
  // TODO: 实现 ESLint 错误正则匹配
  // TODO: 实现 Next.js 构建错误匹配
  // TODO: 实现 npm ERR 匹配
  void rawLog;
  return errors;
}
