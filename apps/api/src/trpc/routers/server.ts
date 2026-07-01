/**
 * Server Router
 *
 * 端点：
 *   - list: 列出当前用户的所有服务器（不含密码）
 *   - create: 创建服务器（密码经 KMS 加密后存储）
 *   - get: 获取单个服务器详情
 *   - delete: 删除服务器
 *   - testConnection: 用临时凭证测试 SSH 连接
 *   - checkDocker: 用已存的凭证检查 Docker 状态
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  CreateServerInputSchema,
  TestConnectionInputSchema,
  TestConnectionResponseSchema,
  type Server,
  type TestConnectionResponse,
} from "@lynxkit/shared";

import { router, protectedProcedure } from "../trpc.js";
import { encryptPassword, decryptPassword } from "../../lib/crypto.js";
import { testConnection, checkDockerOnConnection } from "../../lib/ssh.js";
import { logger } from "../../lib/logger.js";

import { NodeSSH } from "node-ssh";

/**
 * Prisma Server → API 响应的 Server 对象（去除敏感字段，ISO 化时间）
 */
function toServerDto(server: {
  id: string;
  userId: string;
  name: string;
  ip: string;
  port: number;
  username: string;
  encryptedPassword: string;
  sshKey: string | null;
  status: string;
  dockerReady: boolean;
  caddyReady: boolean;
  osInfo: string | null;
  cpuCores: number | null;
  memoryMB: number | null;
  diskGB: number | null;
  createdAt: Date;
  updatedAt: Date;
}): Server {
  return {
    id: server.id,
    userId: server.userId,
    name: server.name,
    ip: server.ip,
    port: server.port,
    username: server.username,
    // 注意：encryptedPassword 仍返回字段（占位），但绝不在 list 接口暴露
    // 真实场景下应分离 createServerDto / serverListItemDto
    encryptedPassword: server.encryptedPassword ? "[encrypted]" : "",
    sshKey: server.sshKey ?? undefined,
    status: server.status as Server["status"],
    dockerReady: server.dockerReady,
    caddyReady: server.caddyReady,
    osInfo: server.osInfo,
    cpuCores: server.cpuCores,
    memoryMB: server.memoryMB,
    diskGB: server.diskGB,
    createdAt: server.createdAt.toISOString(),
    updatedAt: server.updatedAt.toISOString(),
  };
}

export const serverRouter = router({
  /**
   * 列出当前用户的所有服务器
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const servers = await ctx.prisma.server.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
    });
    return servers.map(toServerDto);
  }),

  /**
   * 创建服务器（密码加密后存储）
   *
   * - 密码使用 KMS（AES-256-GCM）加密
   * - 初始状态为 "pending"，等待用户测试连接后更新为 "connected"
   */
  create: protectedProcedure
    .input(CreateServerInputSchema)
    .mutation(async ({ input, ctx }) => {
      const encrypted = await encryptPassword(input.password);
      const encryptedKey = input.sshKey
        ? await encryptPassword(input.sshKey)
        : null;

      const server = await ctx.prisma.server.create({
        data: {
          userId: ctx.user.id,
          name: input.name,
          ip: input.ip,
          port: input.port,
          username: input.username,
          encryptedPassword: encrypted,
          sshKey: encryptedKey,
          status: "pending",
        },
      });

      logger.info(
        { serverId: server.id, userId: ctx.user.id, ip: input.ip },
        "服务器已创建"
      );

      return toServerDto(server);
    }),

  /**
   * 获取服务器详情
   */
  get: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ input, ctx }) => {
      const server = await ctx.prisma.server.findFirst({
        where: { id: input.id, userId: ctx.user.id },
      });
      if (!server) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "服务器不存在或无访问权限",
        });
      }
      return toServerDto(server);
    }),

  /**
   * 删除服务器
   *
   * 注意：如果该服务器下还有项目，应先迁移或删除项目。
   * 当前实现使用级联删除（schema 中 onDelete: Cascade）。
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      const server = await ctx.prisma.server.findFirst({
        where: { id: input.id, userId: ctx.user.id },
      });
      if (!server) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "服务器不存在或无访问权限",
        });
      }

      await ctx.prisma.server.delete({ where: { id: input.id } });
      logger.info({ serverId: input.id }, "服务器已删除");
      return { success: true };
    }),

  /**
   * 测试 SSH 连接（使用临时凭证，不持久化）
   *
   * 成功后可调用 create 持久化，或绑定到已有服务器。
   */
  testConnection: protectedProcedure
    .input(TestConnectionInputSchema)
    .mutation(async ({ input, ctx }): Promise<TestConnectionResponse> => {
      logger.info(
        { userId: ctx.user.id, ip: input.ip },
        "用户触发 SSH 连接测试"
      );
      const result = await testConnection(input);
      return TestConnectionResponseSchema.parse(result);
    }),

  /**
   * 用已存的凭证 SSH 连接检查 Docker 状态
   *
   * - 解密已存的密码
   * - 建立 SSH 连接
   * - 检查 docker daemon 状态
   * - 更新 server.dockerReady 字段
   */
  checkDocker: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      const server = await ctx.prisma.server.findFirst({
        where: { id: input.id, userId: ctx.user.id },
      });
      if (!server) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "服务器不存在或无访问权限",
        });
      }

      const password = await decryptPassword(server.encryptedPassword);
      const ssh = new NodeSSH();

      try {
        await ssh.connect({
          host: server.ip,
          port: server.port,
          username: server.username,
          password,
          readyTimeout: 15000,
        });

        const { ready, version } = await checkDockerOnConnection(ssh);

        const updated = await ctx.prisma.server.update({
          where: { id: server.id },
          data: {
            dockerReady: ready,
            status: ready ? "docker_ready" : "connected",
          },
        });

        logger.info(
          { serverId: server.id, dockerReady: ready, version },
          "Docker 状态检查完成"
        );

        return {
          server: toServerDto(updated),
          dockerReady: ready,
          dockerVersion: version,
        };
      } catch (err) {
        logger.warn(
          { serverId: server.id, err: err instanceof Error ? err.message : String(err) },
          "Docker 检查失败"
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `SSH 连接失败: ${err instanceof Error ? err.message : String(err)}`,
        });
      } finally {
        ssh.dispose();
      }
    }),
});
