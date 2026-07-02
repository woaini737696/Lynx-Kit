/**
 * 写文件工具 - LynxKit agent-core
 *
 * 供 Agent tool calling 使用：把 LLM 生成的文件落盘到工作区。
 * 同时导出纯函数 writeFile，供编排器 / Agent 直接调用。
 *
 * 安全：限制写入路径必须在 workspace 根目录内，禁止路径穿越。
 */

import { mkdir, writeFile as fsWriteFile } from "node:fs/promises";
import { dirname, resolve, relative } from "node:path";
import { tool } from "ai";
import { z } from "zod";
import type { GeneratedFile } from "../types.js";

/**
 * 校验目标路径必须落在 workspace 内，防止路径穿越
 */
export function assertWithinWorkspace(workspace: string, filePath: string): string {
  const ws = resolve(workspace);
  const target = resolve(ws, filePath);
  const rel = relative(ws, target);
  if (rel.startsWith("..") || resolve(ws, rel) !== target) {
    throw new Error(`[file-writer] 路径越界，禁止写入 workspace 之外：${filePath}`);
  }
  return target;
}

/**
 * 写单个文件到 workspace
 */
export async function writeFile(
  workspace: string,
  path: string,
  content: string,
): Promise<string> {
  const target = assertWithinWorkspace(workspace, path);
  await mkdir(dirname(target), { recursive: true });
  await fsWriteFile(target, content, "utf8");
  return target;
}

/**
 * 批量写入生成文件
 */
export async function writeGeneratedFiles(
  workspace: string,
  files: GeneratedFile[],
): Promise<string[]> {
  const written: string[] = [];
  for (const f of files) {
    written.push(await writeFile(workspace, f.path, f.content));
  }
  return written;
}

/**
 * AI SDK tool 定义：写入文件
 */
export function createFileWriterTool(workspace: string) {
  return tool({
    description: "写入一个文件到项目工作区（路径必须在 workspace 内）",
    inputSchema: z.object({
      path: z.string().describe("文件相对路径，如 src/app/page.tsx"),
      content: z.string().describe("文件完整内容"),
      language: z
        .string()
        .optional()
        .describe("编程语言标识，如 typescript / tsx / sql"),
    }),
    execute: async ({ path, content, language }) => {
      const target = await writeFile(workspace, path, content);
      return { path, absolutePath: target, language, bytes: content.length };
    },
  });
}
