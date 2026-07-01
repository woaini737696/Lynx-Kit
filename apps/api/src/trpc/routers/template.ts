/**
 * Template Router
 *
 * 端点：
 *   - list: 列出所有激活模板
 *   - get: 获取模板详情（含 questions）
 *
 * Week 1 暂不接数据库，从 packages/templates 目录读取 template.json。
 * 后续可切换为 Prisma Template 表查询。
 *
 * TODO: 后续切换为 Prisma Template 表查询：
 *   ```ts
 *   const templates = await ctx.prisma.template.findMany({
 *     where: { isActive: true },
 *   });
 *   ```
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { readFile, readdir, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  TemplateSchema,
  TemplateListItemSchema,
  type Template,
  type TemplateListItem,
  PRODUCT_TYPES,
} from "@lynxkit/shared";

import { router, publicProcedure } from "../trpc.js";
import { logger } from "../../lib/logger.js";

/**
 * 定位 packages/templates 目录
 *
 * 开发模式：apps/api → ../../packages/templates
 * 生产模式（dist）：apps/api/dist → ../../../../packages/templates
 *
 * 通过 import.meta.url 解析，避免依赖 cwd
 */
async function findTemplatesDir(): Promise<string | null> {
  const currentDir = fileURLToPath(new URL(".", import.meta.url));
  // 尝试若干个相对路径
  const candidates = [
    resolve(currentDir, "../../../../packages/templates"),
    resolve(currentDir, "../../../packages/templates"),
    resolve(currentDir, "../../packages/templates"),
    resolve(process.cwd(), "packages/templates"),
  ];

  for (const candidate of candidates) {
    try {
      const s = await stat(candidate);
      if (s.isDirectory()) return candidate;
    } catch {
      // 继续尝试
    }
  }
  return null;
}

/**
 * 缓存的模板列表（启动时加载一次）
 */
let cachedTemplates: Template[] | null = null;

/**
 * 从 packages/templates 目录加载所有模板
 *
 * 约定：
 *   packages/templates/<type>/template.json
 *
 * 若目录不存在（如未初始化模板），返回基于 PRODUCT_TYPES 的占位列表。
 */
async function loadTemplates(): Promise<Template[]> {
  if (cachedTemplates) return cachedTemplates;

  const templatesDir = await findTemplatesDir();
  if (!templatesDir) {
    logger.warn(
      "未找到 packages/templates 目录，使用 PRODUCT_TYPES 占位模板列表"
    );
    cachedTemplates = PRODUCT_TYPES.map((meta) => ({
      id: meta.id,
      name: meta.name,
      description: meta.description,
      architecture: meta.architecture,
      version: "1.0.0",
      features: meta.techStack,
      screenshots: [],
      questions: [],
      configMapping: {},
    }));
    return cachedTemplates;
  }

  const templates: Template[] = [];
  let entries: string[] = [];
  try {
    entries = await readdir(templatesDir);
  } catch (err) {
    logger.error(
      { err: err instanceof Error ? err.message : String(err) },
      "读取 templates 目录失败"
    );
    return [];
  }

  for (const entry of entries) {
    const manifestPath = join(templatesDir, entry, "template.json");
    try {
      const content = await readFile(manifestPath, "utf-8");
      const json = JSON.parse(content);
      const parsed = TemplateSchema.parse(json);
      templates.push(parsed);
    } catch (err) {
      logger.warn(
        { entry, err: err instanceof Error ? err.message : String(err) },
        "模板加载失败（跳过）"
      );
    }
  }

  logger.info({ count: templates.length }, "模板加载完成");
  cachedTemplates = templates;
  return templates;
}

export const templateRouter = router({
  /**
   * 列出所有激活模板
   */
  list: publicProcedure.query(async () => {
    const templates = await loadTemplates();
    const items: TemplateListItem[] = templates.map((t) => ({
      id: t.id,
      type: t.id, // 模板 id 即为产品类型
      name: t.name,
      description: t.description,
      version: t.version,
      features: t.features,
      isActive: true,
    }));
    return items.map((i) => TemplateListItemSchema.parse(i));
  }),

  /**
   * 获取模板详情（含 questions 列表）
   */
  get: publicProcedure
    .input(z.object({ type: z.string() }))
    .query(async ({ input }) => {
      const templates = await loadTemplates();
      const template = templates.find((t) => t.id === input.type);
      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `未找到类型为 "${input.type}" 的模板`,
        });
      }
      return TemplateSchema.parse(template);
    }),

  /**
   * 刷新模板缓存（开发期手动触发）
   *
   * TODO: 后续接入文件监听或 Prisma 表
   */
  refresh: publicProcedure.mutation(async () => {
    cachedTemplates = null;
    const templates = await loadTemplates();
    return { count: templates.length };
  }),
});
