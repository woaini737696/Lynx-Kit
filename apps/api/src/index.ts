/**
 * LynxKit API 服务入口
 *
 * 启动流程：
 *   1. 加载环境变量（.env，由 npm scripts 的 --env-file=.env 标志注入）
 *   2. 创建 Fastify 服务器（注册 cors / cookie / jwt / tRPC / OpenAPI）
 *   3. 监听 4000 端口
 *   4. 注册优雅关闭钩子
 *
 * 验证：
 *   - curl http://localhost:4000/health → {"status":"ok","uptime":...}
 *   - curl http://localhost:4000/openapi.json → OpenAPI spec
 */
import { startServer } from "./trpc/server.js";

import { logger } from "./lib/logger.js";

/**
 * 应用主入口
 */
async function main(): Promise<void> {
  try {
    await startServer();
  } catch (err) {
    logger.error(
      { err: err instanceof Error ? err.stack : String(err) },
      "服务启动失败，进程退出"
    );
    process.exit(1);
  }
}

void main();
