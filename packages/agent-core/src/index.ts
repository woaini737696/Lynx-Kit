/**
 * LynxKit 七层 Agent 编排引擎
 *
 * 流程（与产品文档 §8.1 对应）：
 *   用户输入需求
 *     ↓
 *   ① 意图识别 Agent（Haiku，成本极低）
 *     ↓
 *   ② 需求澄清 Agent（自研规则引擎，零成本）
 *     ↓
 *   ③ 模板选择 Agent（自研查表，零成本）
 *     ↓
 *   ④ 配置填充 Agent（Sonnet，中等成本）
 *     ↓
 *   ⑤ 编译测试 Agent（Docker 沙箱，零成本）
 *     ↓ 失败
 *   ⑥ 修复 Agent（L1/L2/L3 三级修复策略）
 *     ↓
 *   ⑦ 部署 Agent（NodeSSH + Docker Compose）
 */

export * from "./agents/intent.js";
export * from "./agents/clarify.js";
export * from "./agents/select.js";
export * from "./agents/fill.js";
export * from "./agents/build.js";
export * from "./agents/fix.js";
export * from "./agents/deploy.js";
export * from "./providers/index.js";

export * from "./orchestrator.js";
