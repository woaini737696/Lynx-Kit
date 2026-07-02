/**
 * @lynxkit/agent-core - LynxKit 9 层 Agent 编排引擎
 *
 * 基于 Vercel AI SDK 5.0 + 国内 6 大模型 Provider（DeepSeek / Kimi / Doubao / Qwen / GLM / Mimo）
 * + BullMQ 异步队列，完成从"用户需求"到"线上部署"的完整链路。
 *
 * 流水线：
 *   ① 意图识别 → ② 架构师 → ③ 需求澄清
 *   → ④ 产品经理 ∥ ⑤ 设计师（并行）
 *   → ⑥ 前端开发 → ⑦ 后端开发 → ⑧ AI 集成（串行）
 *   → ⑨ 测试修复（循环，最多 3 轮）→ ⑩ 部署发布
 *
 * 用法：
 *   import { Orchestrator } from "@lynxkit/agent-core";
 *   const orch = new Orchestrator({ sessionId, userId, inspiration, modelConfig, onLog, onProgress, onStream });
 *   const result = await orch.run();
 */

// 编排引擎核心
export * from "./orchestrator.js";

// 引擎内部类型与基类
export * from "./types.js";

// Provider 模型工厂
export * from "./providers/index.js";

// 10 个 Agent
export * from "./agents/index.js";

// 工具集（写文件 / Drizzle schema 生成 / 组件查找 / 沙箱 Bash）
export * from "./tools/index.js";

// 中文 system prompts
export * from "./prompts/index.js";
