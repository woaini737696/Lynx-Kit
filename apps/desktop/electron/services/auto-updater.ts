import electronUpdater from "electron-updater";
import type { BrowserWindow } from "electron";

const { autoUpdater } = electronUpdater;

/**
 * 自动更新服务（基于 electron-updater + 自建静态服务器）
 *
 * 流程：checkForUpdates → update-available → downloadUpdate → update-downloaded → quitAndInstall
 * 所有事件通过 webContents.send 转发到渲染进程，UI 可监听展示进度。
 *
 * 更新源：
 * - 默认：electron-builder.yml 中的 publish.url（https://updates.lynxkit.com/lynxkit/）
 * - 覆盖：环境变量 LYNXKIT_UPDATE_SERVER_URL（用于测试 / 内部预览 / 切换 CDN）
 *
 * 服务器侧目录结构（generic provider）：
 *   /latest.yml                     # 元数据（version + 文件名 + hash）
 *   /LynxKit-Setup-x.y.z-x64.exe
 *   /LynxKit-x.y.z-x64.exe.blockmap # 增量更新用
 */

/** 默认更新源（与 electron-builder.yml publish.url 保持一致） */
const DEFAULT_FEED_URL = "https://updates.lynxkit.com/lynxkit/";

/** 运行时可通过环境变量覆盖更新源 URL */
function resolveFeedUrl(): string {
  return process.env.LYNXKIT_UPDATE_SERVER_URL ?? DEFAULT_FEED_URL;
}

/** 初始化自动更新监听，将事件转发到渲染进程 */
export function initAutoUpdater(win: BrowserWindow): void {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  // 显式 setFeedURL：允许环境变量覆盖，便于测试 / 内部预览
  const feedUrl = resolveFeedUrl();
  try {
    autoUpdater.setFeedURL({
      provider: "generic",
      url: feedUrl,
      channel: "latest",
    });
  } catch (err) {
    // setFeedURL 在某些环境下可能抛错（如已有 feedURL），仅记录不阻塞
    console.warn(`[auto-updater] setFeedURL 失败：`, err);
  }

  autoUpdater.on("update-available", (info) => {
    win.webContents.send("updater:update-available", info);
  });
  autoUpdater.on("update-not-available", () => {
    win.webContents.send("updater:update-not-available");
  });
  autoUpdater.on("error", (err) => {
    win.webContents.send("updater:error", err?.message ?? String(err));
  });
  autoUpdater.on("download-progress", (p) => {
    win.webContents.send("updater:progress", { percent: p.percent });
  });
  autoUpdater.on("update-downloaded", () => {
    win.webContents.send("updater:downloaded");
  });
}

/** 检查更新（静默失败，错误已通过事件转发） */
export function checkForUpdates(): void {
  // 仅在生产环境真正检查（开发环境无签名 / 服务器未就绪时会抛错）
  if (process.env.NODE_ENV === "development") return;
  autoUpdater.checkForUpdates().catch((err) => {
    console.warn(`[auto-updater] 检查更新失败：`, err?.message ?? err);
  });
}

/** 下载已检测到的更新 */
export function downloadUpdate(): void {
  autoUpdater.downloadUpdate().catch((err) => {
    console.warn(`[auto-updater] 下载更新失败：`, err?.message ?? err);
  });
}

/** 退出并安装已下载的更新 */
export function installAndRestart(): void {
  autoUpdater.quitAndInstall();
}
