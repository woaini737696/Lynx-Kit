/**
 * Provider 类型定义 - LynxKit agent-core
 *
 * 描述模型工厂与 Provider 相关的内部类型。
 * 公共类型（AIModelConfig / AIProvider / ProviderMeta）来自 @lynxkit/shared。
 */

import type { LanguageModel } from "ai";
import type { AIModelConfig } from "@lynxkit/shared";

/**
 * 模型工厂函数签名：按用户配置创建一个 AI SDK LanguageModel 实例
 */
export type ModelCreator = (config: AIModelConfig) => LanguageModel;
