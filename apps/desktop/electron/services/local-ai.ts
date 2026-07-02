/**
 * 本地 AI 检测服务
 *
 * 桌面端特有：检测本机是否运行 Ollama（默认 http://localhost:11434），
 * 并枚举已安装的本地模型，用于 AI 模型配置页的本地模型选项。
 *
 * 使用 Node/Electron 内置的 fetch（Electron 30 / Node 20+ 已全局可用），
 * 不引入额外依赖。
 */

export interface OllamaStatus {
  /** Ollama 服务是否运行 */
  running: boolean;
  /** API 基础地址 */
  apiBase: string;
  /** 已安装的本地模型名称列表 */
  models: string[];
  /** 检测失败原因 */
  error?: string;
}

/** 检测 Ollama 是否在本机运行，并返回已安装的本地模型 */
export async function detectOllama(
  apiBase: string = "http://localhost:11434",
): Promise<OllamaStatus> {
  const base = apiBase.replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      return {
        running: false,
        apiBase,
        models: [],
        error: `Ollama 返回 HTTP ${res.status}`,
      };
    }
    const data = (await res.json()) as { models?: Array<{ name: string }> };
    const models = (data.models ?? []).map((m) => m.name);
    return { running: true, apiBase, models };
  } catch (e) {
    return {
      running: false,
      apiBase,
      models: [],
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/** 仅列出本地模型名称（未运行时返回空数组） */
export async function listLocalModels(
  apiBase: string = "http://localhost:11434",
): Promise<string[]> {
  const status = await detectOllama(apiBase);
  return status.models;
}
