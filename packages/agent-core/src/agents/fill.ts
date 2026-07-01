import type { LLMProvider } from "../providers/types.js";

/**
 * ④ 配置填充 Agent
 *
 * 输入：模板基座路径 + 用户配置 JSON
 * 输出：填充后的完整项目代码包
 *
 * 模型：Claude Sonnet 4.6（中等成本，50K-100K tokens/次）
 *
 * 策略：
 *   - 读取模板基座代码
 *   - 替换 {{占位符}} 为用户配置值
 *   - 生成动态内容（如根据 serviceType 生成不同文案）
 *   - 保持模板骨架不变
 */

export interface FillInput {
  /** 模板基座路径 */
  templatePath: string;
  /** 模板版本 */
  templateVersion: string;
  /** 用户配置 JSON */
  config: Record<string, unknown>;
  /** 项目名称 */
  projectName: string;
}

export interface GeneratedFile {
  /** 文件相对路径（基于项目根目录） */
  path: string;
  /** 文件内容 */
  content: string;
}

export interface FillOutput {
  /** 生成的所有文件 */
  files: GeneratedFile[];
  /** 代码包 hash（用于版本管理） */
  codeHash: string;
  /** 使用的 tokens 数 */
  tokensUsed: number;
}

/**
 * 配置填充 Agent
 *
 * Week 1：仅做占位符替换（不调用 LLM）
 * Week 2：接入 Claude Sonnet 生成动态内容
 */
export async function fillTemplate(
  input: FillInput,
  llm?: LLMProvider
): Promise<FillOutput> {
  // TODO: Week 2 完整实现
  // 1. 读取 templatePath 下所有文件
  // 2. 对每个文件中的 {{占位符}} 用 config 替换
  // 3. 对需要动态生成的文件（如 README.md），调用 LLM 生成
  // 4. 计算代码包 hash（用 crypto.createHash('sha256')）
  // 5. 返回 GeneratedFile[]

  if (llm) {
    // TODO: Week 2 - 调用 Claude Sonnet 生成动态内容
  }

  return {
    files: [],
    codeHash: "",
    tokensUsed: 0,
  };
}

/**
 * 简单占位符替换
 *
 * 将模板内容中的 {{key}} 替换为 config 中对应的值。
 */
export function replacePlaceholders(
  content: string,
  config: Record<string, unknown>
): string {
  return content.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path: string) => {
    const value = getByPath(config, path);
    return value !== undefined ? String(value) : match;
  });
}

/**
 * 按 "a.b.c" 路径读取对象属性
 */
function getByPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}
