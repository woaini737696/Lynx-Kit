/**
 * Agents 模块出口
 *
 * 9 层 Agent 编排（共 10 个角色，TEST_FIX 与 DEPLOY 合并称为"9 层"）：
 *  ① 意图识别 → ② 架构师 → ③ 需求澄清
 *  → ④ 产品经理 ∥ ⑤ 设计师（并行）
 *  → ⑥ 前端开发 → ⑦ 后端开发 → ⑧ AI 集成（串行）
 *  → ⑨ 测试修复（循环，最多 3 轮）→ ⑩ 部署发布
 */

export * from "./01-intent.js";
export * from "./02-architect.js";
export * from "./03-clarify.js";
export * from "./04-product-manager.js";
export * from "./05-designer.js";
export * from "./06-frontend-dev.js";
export * from "./07-backend-dev.js";
export * from "./08-ai-integration.js";
export * from "./09-test-fix.js";
export * from "./10-deploy.js";
