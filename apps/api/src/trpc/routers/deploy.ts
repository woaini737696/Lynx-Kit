/**
 * Deploy Router
 *
 * 端点：
 *   - trigger: 触发部署（创建 DeployLog，加入 deploymentQueue，返回 jobId）
 *   - status: 查询部署任务进度
 *   - logs: 查询项目的部署日志列表
 *
 * 部署状态机（DeployJobStatus）：
 *   queued → uploading → building → starting → configuring → health_checking → completed
 * 任何阶段失败转为 failed
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  DeployInputSchema,
  DeployLogSchema,
  DeployJobStatusSchema,
  type DeployLog,
} from "@lynxkit/shared";

import { router, protectedProcedure } from "../trpc.js";
import { logger } from "../../lib/logger.js";

/**
 * Prisma DeployLog → API 响应的 DeployLog 对象
 */
function toDeployLogDto(log: {
  id: string;
  projectId: string;
  status: string;
  logs: string;
  duration: number | null;
  error: string | null;
  createdAt: Date;
}): DeployLog {
  return {
    id: log.id,
    projectId: log.projectId,
    status: log.status as DeployLog["status"],
    logs: log.logs,
    duration: log.duration,
    error: log.error,
    createdAt: log.createdAt.toISOString(),
  };
}

export const deployRouter = router({
  /**
   * 触发部署
   *
   * - 校验项目归属
   * - 创建 DeployLog（status=pending）
   * - 加入 deploymentQueue，payload 包含 jobId / projectId
   * - 返回 jobId 供客户端轮询
   */
  trigger: protectedProcedure
    .input(DeployInputSchema)
    .mutation(async ({ input, ctx }) => {
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.user.id },
      });
      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "项目不存在或无访问权限",
        });
      }

      // 创建部署日志（pending）
      const deployLog = await ctx.prisma.deployLog.create({
        data: {
          projectId: input.projectId,
          status: "pending",
          logs: "",
        },
      });

      // 入队：deploymentQueue 由 worker 消费
      const job = await ctx.queues.deployment.add(
        "deploy",
        {
          jobId: deployLog.id,
          projectId: input.projectId,
          userId: ctx.user.id,
          regenerate: input.regenerate,
          configSnapshot: project.config,
          serverId: project.serverId,
        },
        {
          // 部署任务超时 5 分钟
          jobId: deployLog.id,
          timeout: 5 * 60 * 1000,
          attempts: 1,
        }
      );

      logger.info(
        {
          jobId: deployLog.id,
          projectId: input.projectId,
          bullJobId: job.id,
          regenerate: input.regenerate,
        },
        "部署任务已入队"
      );

      return {
        jobId: deployLog.id,
        bullJobId: job.id,
        status: "queued" as const,
      };
    }),

  /**
   * 查询部署任务进度
   *
   * - 优先从 BullMQ job 状态推断
   * - 同时返回最新 DeployLog 内容
   *
   * TODO: 接入 SSE / WebSocket 实时推送进度事件
   */
  status: protectedProcedure
    .input(z.object({ jobId: z.string().cuid() }))
    .query(async ({ input, ctx }) => {
      const deployLog = await ctx.prisma.deployLog.findUnique({
        where: { id: input.jobId },
      });
      if (!deployLog) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "部署任务不存在",
        });
      }

      // 校验归属（通过 project → user）
      const project = await ctx.prisma.project.findFirst({
        where: { id: deployLog.projectId, userId: ctx.user.id },
        select: { id: true },
      });
      if (!project) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "无权访问该部署任务",
        });
      }

      // 从 BullMQ 查询 job 状态（best-effort）
      let bullStatus: string | null = null;
      try {
        const job = await ctx.queues.deployment.getJob(input.jobId);
        if (job) {
          bullStatus = await job.getState();
        }
      } catch (err) {
        logger.debug(
          { err: err instanceof Error ? err.message : String(err) },
          "BullMQ job 状态查询失败"
        );
      }

      // 把 BullMQ 状态映射到 DeployJobStatus
      let jobStatus: "queued" | "completed" | "failed" | "active" = "queued";
      if (bullStatus === "completed") jobStatus = "completed";
      else if (bullStatus === "failed") jobStatus = "failed";
      else if (bullStatus === "active" || bullStatus === "delayed") {
        jobStatus = "active";
      }

      return {
        jobId: deployLog.id,
        status: DeployJobStatusSchema.parse(
          deployLog.status === "success"
            ? "completed"
            : deployLog.status === "failed"
              ? "failed"
              : jobStatus === "completed"
                ? "completed"
                : jobStatus === "failed"
                  ? "failed"
                  : "queued"
        ),
        bullStatus,
        logs: deployLog.logs,
        error: deployLog.error,
        duration: deployLog.duration,
        createdAt: deployLog.createdAt.toISOString(),
      };
    }),

  /**
   * 查询项目的部署日志列表
   */
  logs: protectedProcedure
    .input(z.object({ projectId: z.string().cuid() }))
    .query(async ({ input, ctx }) => {
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.user.id },
        select: { id: true },
      });
      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "项目不存在或无访问权限",
        });
      }

      const logs = await ctx.prisma.deployLog.findMany({
        where: { projectId: input.projectId },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return logs.map(toDeployLogDto).map((l) => DeployLogSchema.parse(l));
    }),
});
