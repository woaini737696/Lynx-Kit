import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { dialog, shell, type BrowserWindow } from "electron";

/**
 * 文件系统服务
 *
 * 桌面端本地文件访问能力：保存生成代码到本地、在文件管理器中打开目录 / 定位文件。
 * 默认保存目录为 ~/Documents/LynxKit。
 */

export interface SaveFileResult {
  saved: boolean;
  path: string | null;
  error?: string;
}

/** 弹出系统保存对话框，将内容写入用户选择的路径 */
export async function saveFile(
  win: BrowserWindow,
  fileName: string,
  content: string,
  defaultDir?: string,
): Promise<SaveFileResult> {
  const dir = defaultDir ?? path.join(os.homedir(), "Documents", "LynxKit");
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {
    // 目录已存在或无权限，忽略（dialog 仍可使用）
  }

  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: "保存到本地",
    defaultPath: path.join(dir, fileName),
    properties: ["createDirectory", "showOverwriteConfirmation"],
  });

  if (canceled || !filePath) {
    return { saved: false, path: null };
  }

  try {
    await fs.writeFile(filePath, content, "utf-8");
    return { saved: true, path: filePath };
  } catch (e) {
    return {
      saved: false,
      path: null,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/** 在系统文件管理器中打开指定目录 */
export async function openFolder(folderPath: string): Promise<boolean> {
  const err = await shell.openPath(folderPath);
  return !err;
}

/** 在文件管理器中高亮定位到某个文件 */
export async function showInFolder(fullPath: string): Promise<void> {
  shell.showItemInFolder(fullPath);
}
