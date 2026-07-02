import electronUpdater from "electron-updater";
import type { BrowserWindow } from "electron";

const { autoUpdater } = electronUpdater;

/**
 * 自动更新服务（基于 electron-updater + GitHub Releases）
 *
 * 流程：checkForUpdates → update-available → downloadUpdate → update-downloaded → quitAndInstall
 * 所有事件通过 webContents.send 转发到渲染进程，UI 可监听展示进度。
 */

/** 初始化自动更新监听，将事件转发到渲染进程 */
export function initAutoUpdater(win: BrowserWindow): void {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

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
  // 仅在生产环境真正检查
  if (process.env.NODE_ENV === "development") return;
  autoUpdater.checkForUpdates().catch(() => {
    /* 忽略：开发环境无 publish 配置时会抛错 */
  });
}

/** 下载已检测到的更新 */
export function downloadUpdate(): void {
  autoUpdater.downloadUpdate().catch(() => {
    /* 忽略 */
  });
}

/** 退出并安装已下载的更新 */
export function installAndRestart(): void {
  autoUpdater.quitAndInstall();
}
