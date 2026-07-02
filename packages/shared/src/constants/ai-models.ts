/**
 * AI Provider 与模型配置 - LynxKit v1.0
 *
 * 国内 6 大模型生态（DeepSeek / Kimi / Doubao / Qwen / GLM / Mimo）
 * + 桌面端本地模型（Ollama / llama.cpp）。
 */

import { AIProvider, type ProviderMeta } from "../types/ai.js";

/**
 * 全量 AI Provider 元数据列表
 */
export const AI_PROVIDERS: ProviderMeta[] = [
  {
    id: AIProvider.DEEPSEEK,
    name: "DeepSeek 深度求索",
    apiBase: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
    description: "代码生成能力最强，推理模型领先",
    website: "https://platform.deepseek.com",
    models: [
      {
        id: "deepseek-chat",
        name: "DeepSeek-V3",
        contextWindow: 64000,
        price: { input: 0.001, output: 0.002 },
        capabilities: ["code", "chat", "reasoning"],
      },
      {
        id: "deepseek-reasoner",
        name: "DeepSeek-R1",
        contextWindow: 64000,
        price: { input: 0.004, output: 0.016 },
        capabilities: ["reasoning", "code"],
      },
      {
        id: "deepseek-coder",
        name: "DeepSeek-Coder",
        contextWindow: 128000,
        price: { input: 0.001, output: 0.002 },
        capabilities: ["code"],
      },
    ],
  },
  {
    id: AIProvider.KIMI,
    name: "Kimi 月之暗面",
    apiBase: "https://api.moonshot.cn/v1",
    defaultModel: "moonshot-v1-32k",
    description: "长上下文 200 万 tokens，适合长文档",
    website: "https://platform.moonshot.cn",
    models: [
      {
        id: "moonshot-v1-8k",
        name: "Moonshot 8K",
        contextWindow: 8000,
        price: { input: 0.012, output: 0.012 },
        capabilities: ["chat"],
      },
      {
        id: "moonshot-v1-32k",
        name: "Moonshot 32K",
        contextWindow: 32000,
        price: { input: 0.024, output: 0.024 },
        capabilities: ["chat", "long-context"],
      },
      {
        id: "moonshot-v1-128k",
        name: "Moonshot 128K",
        contextWindow: 128000,
        price: { input: 0.06, output: 0.06 },
        capabilities: ["chat", "long-context"],
      },
      {
        id: "kimi-latest",
        name: "Kimi Latest",
        contextWindow: 128000,
        price: { input: 0.024, output: 0.024 },
        capabilities: ["chat", "code", "long-context"],
      },
    ],
  },
  {
    id: AIProvider.DOUBAO,
    name: "Doubao 字节豆包",
    apiBase: "https://ark.cn-beijing.volces.com/api/v3",
    defaultModel: "doubao-pro-32k",
    description: "字节出品，高性价比",
    website: "https://www.volcengine.com/product/doubao",
    models: [
      {
        id: "doubao-pro-32k",
        name: "Doubao Pro 32K",
        contextWindow: 32000,
        price: { input: 0.0008, output: 0.002 },
        capabilities: ["chat", "reasoning"],
      },
      {
        id: "doubao-pro-128k",
        name: "Doubao Pro 128K",
        contextWindow: 128000,
        price: { input: 0.005, output: 0.015 },
        capabilities: ["chat", "long-context"],
      },
      {
        id: "doubao-lite-32k",
        name: "Doubao Lite 32K",
        contextWindow: 32000,
        price: { input: 0.0003, output: 0.0006 },
        capabilities: ["chat"],
      },
    ],
  },
  {
    id: AIProvider.QWEN,
    name: "Qwen 阿里通义千问",
    apiBase: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    defaultModel: "qwen-plus",
    description: "通用场景表现优异，意图识别强",
    website: "https://dashscope.aliyun.com",
    models: [
      {
        id: "qwen-turbo",
        name: "Qwen Turbo",
        contextWindow: 8000,
        price: { input: 0.0003, output: 0.0006 },
        capabilities: ["chat"],
      },
      {
        id: "qwen-plus",
        name: "Qwen Plus",
        contextWindow: 128000,
        price: { input: 0.0008, output: 0.002 },
        capabilities: ["chat", "code", "reasoning"],
      },
      {
        id: "qwen-max",
        name: "Qwen Max",
        contextWindow: 32000,
        price: { input: 0.02, output: 0.06 },
        capabilities: ["reasoning", "code"],
      },
      {
        id: "qwen-coder-plus",
        name: "Qwen Coder Plus",
        contextWindow: 128000,
        price: { input: 0.0035, output: 0.0035 },
        capabilities: ["code"],
      },
    ],
  },
  {
    id: AIProvider.GLM,
    name: "GLM 智谱 ChatGLM",
    apiBase: "https://open.bigmodel.cn/api/paas/v4",
    defaultModel: "glm-4-plus",
    description: "中文场景表现优异，架构推荐强",
    website: "https://open.bigmodel.cn",
    models: [
      {
        id: "glm-4-plus",
        name: "GLM-4-Plus",
        contextWindow: 128000,
        price: { input: 0.05, output: 0.05 },
        capabilities: ["chat", "reasoning", "code"],
      },
      {
        id: "glm-4-flash",
        name: "GLM-4-Flash",
        contextWindow: 128000,
        price: { input: 0.0001, output: 0.0001 },
        capabilities: ["chat"],
      },
      {
        id: "glm-4-air",
        name: "GLM-4-Air",
        contextWindow: 128000,
        price: { input: 0.0002, output: 0.0002 },
        capabilities: ["chat", "code"],
      },
    ],
  },
  {
    id: AIProvider.MIMO,
    name: "Mimo 小米",
    apiBase: "http://localhost:11434/v1",
    defaultModel: "mimo-coder",
    description: "小米 MiMo 系列，桌面端本地推理",
    website: "https://github.com/XiaomiMimo",
    isLocal: true,
    models: [
      {
        id: "mimo-7b",
        name: "MiMo 7B",
        contextWindow: 32000,
        capabilities: ["chat", "reasoning"],
      },
      {
        id: "mimo-coder",
        name: "MiMo Coder",
        contextWindow: 32000,
        capabilities: ["code"],
      },
    ],
  },
  {
    id: AIProvider.LOCAL,
    name: "本地模型（Ollama / llama.cpp）",
    apiBase: "http://localhost:11434/v1",
    defaultModel: "qwen2.5-coder:7b",
    description: "桌面端本地推理，离线可用，隐私安全",
    website: "https://ollama.com",
    isLocal: true,
    models: [
      {
        id: "qwen2.5-coder:7b",
        name: "Qwen2.5 Coder 7B (本地)",
        contextWindow: 32000,
        capabilities: ["code"],
      },
      {
        id: "qwen2.5:7b",
        name: "Qwen2.5 7B (本地)",
        contextWindow: 32000,
        capabilities: ["chat"],
      },
      {
        id: "deepseek-r1:7b",
        name: "DeepSeek R1 7B (本地)",
        contextWindow: 32000,
        capabilities: ["reasoning"],
      },
    ],
  },
];

/**
 * 根据 Provider ID 获取元数据
 */
export function getProvider(id: AIProvider): ProviderMeta | undefined {
  return AI_PROVIDERS.find((p) => p.id === id);
}

/**
 * 列出所有本地 Provider（用于桌面端默认配置）
 */
export function getLocalProviders(): ProviderMeta[] {
  return AI_PROVIDERS.filter((p) => p.isLocal);
}

/**
 * 列出所有云端 Provider（需要 apiKey）
 */
export function getCloudProviders(): ProviderMeta[] {
  return AI_PROVIDERS.filter((p) => !p.isLocal);
}
