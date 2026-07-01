import type { ProjectType } from "@lynxkit/shared";

/**
 * ③ 模板选择 Agent（自研查表，零成本）
 *
 * 输入：产品类型
 * 输出：对应模板基座路径 + 版本号
 *
 * 实现：
 *   - 纯查表，无 LLM 调用
 *   - 返回 packages/templates/<type>/ 的路径
 *   - 版本号从对应 template.json 读取
 */

export interface SelectInput {
  /** 产品类型 */
  projectType: ProjectType;
  /** 指定版本（可选，默认最新） */
  version?: string;
}

export interface SelectOutput {
  /** 模板 ID */
  templateId: string;
  /** 模板基座路径（相对 monorepo 根目录） */
  basePath: string;
  /** 版本号 */
  version: string;
  /** 架构标签 */
  architecture: string;
}

/**
 * 模板路径映射表
 */
const TEMPLATE_PATH_MAP: Record<ProjectType, { path: string; architecture: string }> = {
  "static-site": {
    path: "packages/templates/static-site",
    architecture: "static",
  },
  "service-booking": {
    path: "packages/templates/service-booking",
    architecture: "booking",
  },
  "content-publish": {
    path: "packages/templates/content-publish",
    architecture: "content",
  },
  "light-commerce": {
    path: "packages/templates/light-commerce",
    architecture: "commerce",
  },
  "event-manage": {
    path: "packages/templates/event-manage",
    architecture: "event",
  },
  "admin-dashboard": {
    path: "packages/templates/admin-dashboard",
    architecture: "admin",
  },
};

/**
 * 模板选择 Agent
 *
 * 纯查表，无 LLM 调用。
 *
 * TODO: Week 2 增加版本管理（从数据库读取 Template 表，按版本号选择）
 */
export async function selectTemplate(input: SelectInput): Promise<SelectOutput> {
  const meta = TEMPLATE_PATH_MAP[input.projectType];
  if (!meta) {
    throw new Error(`未找到产品类型 "${input.projectType}" 对应的模板`);
  }

  return {
    templateId: input.projectType,
    basePath: meta.path,
    version: input.version ?? "1.0.0",
    architecture: meta.architecture,
  };
}
