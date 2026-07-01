/**
 * App Router 聚合
 *
 * 把 auth / server / project / template / deploy 五个子 router 合并成 appRouter。
 * 暴露 AppRouter 类型供客户端使用（通过 @trpc/server 的 type 推断）。
 */
import { router } from "../trpc.js";

import { authRouter } from "./auth.js";
import { serverRouter } from "./server.js";
import { projectRouter } from "./project.js";
import { templateRouter } from "./template.js";
import { deployRouter } from "./deploy.js";

export const appRouter = router({
  auth: authRouter,
  server: serverRouter,
  project: projectRouter,
  template: templateRouter,
  deploy: deployRouter,
});

export type AppRouter = typeof appRouter;
