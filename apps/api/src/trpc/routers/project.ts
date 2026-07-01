/**
 * Project Router
 *
 * 端点：
 *   - list: 分页列出当前用户的项目
 *   - get: 获取项目详情
 *   - create: 创建项目（初始化空 config）
 *   - updateConfig: 更新项目配置（创建版本快照）
 *   - delete: 删除项目
 *   - listVersions: 列出项目版本快照
 *   - rollback: 回滚到指定版本
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  CreateProjectInputSchema,
  PaginationInputSchema,
  type Project,
  type ProjectVersion,
} from "@lynxkit/shared";

import { router, protectedProcedure } from "../trpc.js";
import { logger } from "../../lib/logger.js";
import { createHash } from "node:crypto";

/**
 * Prisma Project → API 响应的 Project 对象
 */
function toProjectDto(project: {
  id: string;
  userId: string;
  serverId: string;
  name: string;
  type: string;
  config: unknown;
  status: string;
  domain: string | null;
  customDomain: string | null;
  version: number;
  deployUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Project {
  return {
    id: project.id,
    userId: project.userId,
    serverId: project.serverId,
    name: project.name,
    type: project.type as Project["type"],
    config: (project.config as Record<string, unknown>) ?? {},
    status: project.status as Project["status"],
    domain: project.domain,
    customDomain: project.customDomain,
    version: project.version,
    deployUrl: project.deployUrl,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

function toVersionDto(version: {
  id: string;
  projectId: string;
  version: number;
  config: unknown;
  codeHash: string;
  createdAt: Date;
}): ProjectVersion {
  return {
    id: version.id,
    projectId: version.projectId,
    version: version.version,
    config: (version.config as Record<string, unknown>) ?? {},
    codeHash: version.codeHash,
    createdAt: version.createdAt.toISOString(),
  };
}

/**
 * 计算配置的 SHA-256 哈希（用作 codeHash 占位）
 *
 * 真实 codeHash 应为代码包的 hash，由代码生成 worker 产出。
 */
function hashConfig(config: unknown): string {
  const json = JSON.stringify(config ?? {});
  return createHash("sha256").update(json).digest("hex");
}

export const projectRouter = router({
  /**
   * 分页列出当前用户的项目
   */
  list: protectedProcedure
    .input(PaginationInputSchema.optional())
    .query(async ({ input, ctx }) => {
      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 20;

      const [items, total] = await Promise.all([
        ctx.prisma.project.findMany({
          where: { userId: ctx.user.id },
          orderBy: { updatedAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            server: { select: { id: true, name: true, ip: true, status: true } },
          },
        }),
        ctx.prisma.project.count({ where: { userId: ctx.user.id } }),
      ]);

      return {
        items: items.map(toProjectDto),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  /**
   * 获取项目详情
   */
  get: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ input, ctx }) => {
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.id, userId: ctx.user.id },
      });
      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "项目不存在或无访问权限",
        });
      }
      return toProjectDto(project);
    }),

  /**
   * 创建项目（初始化空 config）
   *
   * - 校验指定的 serverId 属于当前用户
   * - 创建 ProjectVersion v1 快照
   */
  create: protectedProcedure
    .input(CreateProjectInputSchema)
    .mutation(async ({ input, ctx }) => {
      // 校验服务器归属
      const server = await ctx.prisma.server.findFirst({
        where: { id: input.serverId, userId: ctx.user.id },
      });
      if (!server) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "指定的服务器不存在或无访问权限",
        });
      }

      const project = await ctx.prisma.project.create({
        data: {
          userId: ctx.user.id,
          serverId: input.serverId,
          name: input.name,
          type: input.type,
          config: {},
          status: "draft",
          version: 1,
        },
      });

      // 创建初始版本快照
      await ctx.prisma.projectVersion.create({
        data: {
          projectId: project.id,
          version: 1,
          config: {},
          codeHash: hashConfig({}),
        },
      });

      logger.info(
        { projectId: project.id, userId: ctx.user.id, type: input.type },
        "项目已创建"
      );

      return toProjectDto(project);
    }),

  /**
   * 更新项目配置
   *
   * - 更新 config 字段
   * - 自增 version
   * - 创建 ProjectVersion 快照
   * - 状态置为 "clarifying"（等待用户确认生成）
   */
  updateConfig: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        config: z.record(z.unknown()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.id, userId: ctx.user.id },
      });
      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "项目不存在或无访问权限",
        });
      }

      const newVersion = project.version + 1;
      const codeHash = hashConfig(input.config);

      const [updated] = await ctx.prisma.$transaction([
        ctx.prisma.project.update({
          where: { id: input.id },
          data: {
            config: input.config,
            version: newVersion,
            status: "clarifying",
          },
        }),
        ctx.prisma.projectVersion.create({
          data: {
            projectId: input.id,
            version: newVersion,
            config: input.config,
            codeHash,
          },
        }),
      ]);

      logger.info(
        { projectId: input.id, version: newVersion, codeHash },
        "项目配置已更新"
      );

      return toProjectDto(updated);
    }),

  /**
   * 删除项目（级联删除版本和日志）
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.id, userId: ctx.user.id },
      });
      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "项目不存在或无访问权限",
        });
      }

      await ctx.prisma.project.delete({ where: { id: input.id } });
      logger.info({ projectId: input.id }, "项目已删除");
      return { success: true };
    }),

  /**
   * 列出项目的所有版本快照
   */
  listVersions: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ input, ctx }) => {
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.id, userId: ctx.user.id },
        select: { id: true },
      });
      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "项目不存在或无访问权限",
        });
      }

      const versions = await ctx.prisma.projectVersion.findMany({
        where: { projectId: input.id },
        orderBy: { version: "desc" },
      });
      return versions.map(toVersionDto);
    }),

  /**
   * 回滚到指定版本
   *
   * - 把指定版本的 config 应用到 project
   * - 创建一个新的 version 号（不覆盖历史）
   * - 状态重置为 "draft"
   */
  rollback: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        versionId: z.string().cuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.id, userId: ctx.user.id },
      });
      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "项目不存在或无访问权限",
        });
      }

      const targetVersion = await ctx.prisma.projectVersion.findFirst({
        where: { id: input.versionId, projectId: input.id },
      });
      if (!targetVersion) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "指定的版本不存在",
        });
      }

      const newVersion = project.version + 1;
      const codeHash = hashConfig(targetVersion.config);

      const [updated] = await ctx.prisma.$transaction([
        ctx.prisma.project.update({
          where: { id: input.id },
          data: {
            config: targetVersion.config,
            version: newVersion,
            status: "draft",
          },
        }),
        ctx.prisma.projectVersion.create({
          data: {
            projectId: input.id,
            version: newVersion,
            config: targetVersion.config,
            codeHash,
          },
        }),
      ]);

      logger.info(
        {
          projectId: input.id,
          rolledFrom: project.version,
          rolledTo: newVersion,
          sourceVersion: targetVersion.version,
        },
        "项目已回滚"
      );

      return toProjectDto(updated);
    }),
});
