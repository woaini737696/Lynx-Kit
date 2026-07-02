/**
 * Bash 执行器（沙箱） - LynxKit agent-core
 *
 * 供 ⑨ 测试修复 Agent 调用，运行 tsc / lint 等命令。
 *
 * 沙箱策略：
 *   - 命令白名单：仅允许 tsc / eslint / biome / pnpm / npm / npx / node
 *   - 路径限制：cwd 必须在 workspace 内
 *   - 超时：默认 120s，防止挂死
 *   - 不支持管道到 shell（仅执行首个 token + 参数，避免注入）
 */

import { execFileSync, type ExecFileSyncOptions } from "node:child_process";
import { resolve, relative } from "node:path";
import { tool } from "ai";
import { z } from "zod";

/** 命令白名单（可执行程序名） */
const ALLOWED_BINARIES: ReadonlySet<string> = new Set([
  "tsc",
  "eslint",
  "biome",
  "pnpm",
  "npm",
  "npx",
  "node",
]);

export interface BashResult {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

/**
 * 校验 cwd 必须在 workspace 内
 */
function assertCwdWithin(workspace: string, cwd: string): string {
  const ws = resolve(workspace);
  const target = resolve(cwd);
  const rel = relative(ws, target);
  if (rel.startsWith("..") || resolve(ws, rel) !== target) {
    throw new Error(`[bash-executor] cwd 越界，禁止在 workspace 之外执行：${cwd}`);
  }
  return target;
}

/**
 * 执行一条沙箱命令
 *
 * @param command 完整命令字符串，首个 token 必须在白名单内
 * @param opts.cwd 工作目录（必须在 workspace 内）
 * @param opts.workspace workspace 根目录
 * @param opts.timeoutMs 超时毫秒，默认 120000
 */
export function executeBash(
  command: string,
  opts: { cwd: string; workspace: string; timeoutMs?: number },
): BashResult {
  const tokens = command.trim().split(/\s+/);
  if (tokens.length === 0) {
    throw new Error("[bash-executor] 空命令");
  }
  const bin = tokens[0] as string;
  if (!ALLOWED_BINARIES.has(bin)) {
    throw new Error(
      `[bash-executor] 命令 ${bin} 不在白名单内（允许：${[...ALLOWED_BINARIES].join(", ")}）`,
    );
  }

  const cwd = assertCwdWithin(opts.workspace, opts.cwd);
  const args = tokens.slice(1);
  const start = Date.now();
  const timeout = opts.timeoutMs ?? 120_000;

  const execOpts: ExecFileSyncOptions = {
    cwd,
    timeout: timeout,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 10 * 1024 * 1024,
    shell: false,
  };

  try {
    const stdout = execFileSync(bin, args, execOpts) as string;
    return {
      command,
      exitCode: 0,
      stdout,
      stderr: "",
      durationMs: Date.now() - start,
    };
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; status?: number };
    return {
      command,
      exitCode: typeof e.status === "number" ? e.status : 1,
      stdout: e.stdout ?? "",
      stderr: e.stderr ?? (err instanceof Error ? err.message : String(err)),
      durationMs: Date.now() - start,
    };
  }
}

/**
 * AI SDK tool 定义：执行沙箱命令
 */
export function createBashTool(workspace: string) {
  return tool({
    description: "在沙箱中执行白名单命令（tsc/eslint/pnpm 等），用于测试与构建",
    inputSchema: z.object({
      command: z.string().describe("完整命令，如 tsc --noEmit"),
      cwd: z
        .string()
        .optional()
        .describe("工作目录（相对 workspace），默认 workspace 根"),
      timeoutMs: z.number().optional().describe("超时毫秒，默认 120000"),
    }),
    execute: async ({ command, cwd, timeoutMs }) => {
      return executeBash(command, {
        cwd: cwd ?? workspace,
        workspace,
        timeoutMs,
      });
    },
  });
}
