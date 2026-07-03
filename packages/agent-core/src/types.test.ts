/**
 * 引擎内部类型纯函数单元测试
 *
 * 覆盖：
 * - TC-201：parseGeneratedFiles 解析多文件块
 * - TC-202：parseGeneratedFiles 无匹配返回空数组
 * - TC-203：inferLanguage 扩展名映射
 * - TC-204：inferLanguage 未知扩展名返回 text
 */
import { describe, it, expect } from "vitest";
import { parseGeneratedFiles, inferLanguage } from "./types";

describe("parseGeneratedFiles", () => {
  it("TC-201：应解析多文件块并保持顺序", () => {
    const text = [
      `<<<FILE: src/a.ts>>>\nexport const a = 1;\n<<<END_FILE>>>`,
      `<<<FILE: src/b.tsx>>>\nexport const b = 2;\n<<<END_FILE>>>`,
    ].join("\n\n");

    const files = parseGeneratedFiles(text);

    expect(files).toHaveLength(2);
    expect(files[0]?.path).toBe("src/a.ts");
    expect(files[0]?.content).toBe("export const a = 1;");
    expect(files[0]?.language).toBe("typescript");
    expect(files[1]?.path).toBe("src/b.tsx");
    expect(files[1]?.language).toBe("tsx");
  });

  it("TC-202：无匹配时返回空数组", () => {
    expect(parseGeneratedFiles("没有任何文件块")).toEqual([]);
    expect(parseGeneratedFiles("")).toEqual([]);
  });
});

describe("inferLanguage", () => {
  it("TC-203：应正确映射常见扩展名", () => {
    expect(inferLanguage("a.ts")).toBe("typescript");
    expect(inferLanguage("a.tsx")).toBe("tsx");
    expect(inferLanguage("a.js")).toBe("javascript");
    expect(inferLanguage("a.json")).toBe("json");
    expect(inferLanguage("a.css")).toBe("css");
    expect(inferLanguage("a.sql")).toBe("sql");
    expect(inferLanguage("a.md")).toBe("markdown");
    expect(inferLanguage("a.yml")).toBe("yaml");
  });

  it("TC-204：未知扩展名返回 text", () => {
    expect(inferLanguage("a.unknownext")).toBe("text");
    expect(inferLanguage("noext")).toBe("text");
  });
});
