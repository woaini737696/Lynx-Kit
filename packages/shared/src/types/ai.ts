/**
 * AI Provider 与模型配置类型 - LynxKit v1.0
 *
 * 聚焦国内 6 大模型生态（DeepSeek / Kimi / Doubao / Qwen / GLM / Mimo）
 * + 桌面端本地模型（Ollama / llama.cpp）。
 */

/**
 * AI Provider 枚举
 *
 * - DEEPSEEK：DeepSeek 深度求索
 * - KIMI：Kimi 月之暗面
 * - DOUBAO：Doubao 字节豆包
 * - QWEN：Qwen 阿里通义千问
 * - GLM：GLM 智谱 ChatGLM
 * - MIMO：Mimo 小米
 * - LOCAL：桌面端本地（Ollama / llama.cpp）
 */
export enum AIProvider {
  DEEPSEEK = "deepseek",
  KIMI = "kimi",
  DOUBAO = "doubao",
  QWEN = "qwen",
  GLM = "glm",
  MIMO = "mimo",
  LOCAL = "local",
}

/**
 * 模型能力集合
 */
export type ModelCapability =
  | "code"
  | "reasoning"
  | "chat"
  | "vision"
  | "long-context";

/**
 * 模型元数据
 */
export interface ModelMeta {
  /** 模型 ID（API 调用使用） */
  id: string;
  /** 展示名 */
  name: string;
  /** 上下文窗口（tokens） */
  contextWindow: number;
  /** 价格（元/千 tokens），本地模型可省略 */
  price?: {
    /** 输入价格 */
    input: number;
    /** 输出价格 */
    output: number;
  };
  /** 能力标签 */
  capabilities: ModelCapability[];
}

/**
 * Provider 元数据（描述一个 AI 服务商的全部可调用模型）
 */
export interface ProviderMeta {
  /** Provider 标识 */
  id: AIProvider;
  /** 展示名 */
  name: string;
  /** API 基础地址 */
  apiBase: string;
  /** 默认模型 ID */
  defaultModel: string;
  /** 该 Provider 提供的模型列表 */
  models: ModelMeta[];
  /** 简介 */
  description: string;
  /** 是否为本地模型（无需联网、无需 apiKey） */
  isLocal?: boolean;
  /** 官网 */
  website: string;
}

/**
 * 用户侧 AI 模型配置（持久化到用户偏好设置）
 */
export interface AIModelConfig {
  /** Provider 标识 */
  provider: AIProvider;
  /** API Key（用户填入，加密存储） */
  apiKey: string;
  /** API 基础地址（覆盖 ProviderMeta.apiBase） */
  apiBase: string;
  /** 模型 ID */
  model: string;
  /** 采样温度（0~2，默认 0.3） */
  temperature?: number;
  /** 单次请求最大 tokens（默认 8192） */
  maxTokens?: number;
}
