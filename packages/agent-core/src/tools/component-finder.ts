/**
 * shadcn 组件查找器 - LynxKit agent-core
 *
 * 把 Designer Agent 产出的组件名清单映射到 @lynxkit/ui-web 的实际导出路径，
 * 便于前端开发 Agent 引用正确的组件来源。
 */

import { tool } from "ai";
import { z } from "zod";

/**
 * @lynxkit/ui-web 已提供的 shadcn 组件清单
 * 与 packages/ui-web/src/index.ts 保持同步
 */
const UI_WEB_COMPONENTS: ReadonlySet<string> = new Set([
  "avatar",
  "badge",
  "button",
  "card",
  "dialog",
  "dropdown-menu",
  "input",
  "label",
  "progress",
  "scroll-area",
  "select",
  "separator",
  "sheet",
  "skeleton",
  "spinner",
  "tabs",
  "textarea",
  "toast",
  "toaster",
  "tooltip",
]);

export interface ComponentMatch {
  name: string;
  source: "@lynxkit/ui-web" | "shadcn-ui (需安装)" | "自定义";
  importPath: string;
}

/**
 * 查找组件来源
 */
export function findShadcnComponents(names: string[]): ComponentMatch[] {
  return names.map((raw) => {
    const name = raw.trim();
    const lower = name.toLowerCase();
    if (UI_WEB_COMPONENTS.has(lower)) {
      return {
        name,
        source: "@lynxkit/ui-web",
        importPath: `@lynxkit/ui-web`,
      };
    }
    // 常见 shadcn 但未内置的组件，提示需安装
    return {
      name,
      source: "shadcn-ui (需安装)" as const,
      importPath: `@/components/ui/${lower}`,
    };
  });
}

/**
 * AI SDK tool 定义：查找 shadcn 组件来源
 */
export function createComponentFinderTool() {
  return tool({
    description: "查询 shadcn 组件的导入来源（@lynxkit/ui-web 内置或需安装）",
    inputSchema: z.object({
      components: z.array(z.string()).describe("组件名清单，如 Button / Card"),
    }),
    execute: async ({ components }) => {
      return { matches: findShadcnComponents(components) };
    },
  });
}
