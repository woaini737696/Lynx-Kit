/**
 * 构建启动服务 - LynxKit API
 *
 * 封装"入队 / 同步降级"双路径决策：
 *   - Redis 可用 → enqueueBuild 入队 BullMQ，返回 jobId，sync=false
 *   - Redis 不可用 → 直接调用 processBuildJob 同步执行（开发模式降级），sync=true
 *
 * 由 POST /build/:id/start 路由调用，避免在路由层散布降级逻辑。
 */
import { enqueueBuild } from "./queue.js";
import { processBuildJob } from "./build-runner.js";

/** 构建启动输入（与 queue.ts / build-runner.ts 的 BuildJobData 结构对齐） */
export interface BuildStartInput {
  sessionId: string;
  userId: string;
  userInput: string;
  answers?: Record<string, unknown>;
  serverId?: string;
  domain?: string;
}

/** 构建启动结果 */
export interface BuildStartOutput {
  sessionId: string;
  jobId: string | null;
  /** true=同步执行（Redis 不可用降级）；false=已入队异步执行 */
  sync: boolean;
  status: string;
}

/**
 * 启动构建任务。
 *
 * 优先入队 BullMQ；队列不可用时（Redis 未配置或不可达）同步执行 build-runner，
 * 供开发环境或低并发场景直接得到结果。
 */
export async function startBuildOrSync(
  input: BuildStartInput,
): Promise<BuildStartOutput> {
  const jobId = await enqueueBuild(input);

  if (jobId) {
    return {
      sessionId: input.sessionId,
      jobId,
      sync: false,
      status: "DEVELOPING",
    };
  }

  // Redis 不可用 → 同步执行（开发模式降级）
  // processBuildJob 内部会更新状态为 DEVELOPING 并写 build_logs
  await processBuildJob(input);

  return {
    sessionId: input.sessionId,
    jobId: null,
    sync: true,
    status: "DEVELOPING",
  };
}
