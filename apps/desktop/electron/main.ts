import {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  shell,
  Menu,
  type Tray,
} from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { createTray, showNotification, setTrayLabel, destroyTray } from "./services/notification.js";
import { saveFile, openFolder, showInFolder } from "./services/filesystem.js";
import { detectOllama, listLocalModels } from "./services/local-ai.js";
import {
  initAutoUpdater,
  checkForUpdates,
  downloadUpdate,
  installAndRestart,
} from "./services/auto-updater.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// electron-vite dev 会设置 ELECTRON_RENDERER_URL 环境变量
const DEV_SERVER_URL = process.env.ELECTRON_RENDERER_URL ?? process.env.VITE_DEV_SERVER_URL;
const isDev = !!DEV_SERVER_URL;

// electron-vite 产物：main 在 out/main/，preload 在 out/preload/index.mjs
const PRELOAD_PATH = path.join(__dirname, "..", "preload", "index.mjs");
const LOG_FILE = path.join(__dirname, "..", "..", "renderer-debug.log");
function logDebug(msg: string): void {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try { fs.appendFileSync(LOG_FILE, line); } catch { /* ignore */ }
  console.log(msg);
}

let win: BrowserWindow | null = null;
let tray: Tray | null = null;

function createWindow(): void {
  win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 1000,
    minHeight: 600,
    show: false,
    backgroundColor: "#ffffff",
    title: "LynxKit",
    frame: false,
    titleBarStyle: "hidden",
    autoHideMenuBar: true,
    webPreferences: {
      preload: PRELOAD_PATH,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.once("ready-to-show", () => {
    win?.show();
    // 启动后检查更新
    checkForUpdates();
  });

  // 捕获渲染进程 console 消息（Electron 30+ 签名：details 对象）
  win.webContents.on("console-message", (_e, details) => {
    const level = (details as { level: number }).level;
    const message = (details as { message: string }).message;
    const line = (details as { lineNumber: number }).lineNumber;
    const sourceId = (details as { sourceId: string }).sourceId;
    const tag = ["LOG", "WARN", "ERROR", "DEBUG"][level] ?? "LOG";
    logDebug(`[renderer:${tag}] ${message} (${sourceId}:${line})`);
  });
  // 捕获渲染进程未处理的异常
  win.webContents.on("render-process-gone", (_e, details) => {
    logDebug(`[renderer:CRASH] ${JSON.stringify(details)}`);
  });
  win.webContents.on("did-fail-load", (_e, code, desc, url) => {
    logDebug(`[renderer:FAIL_LOAD] ${code} ${desc} url=${url}`);
  });
  // 页面加载完成后检查 #root 内容
  win.webContents.on("did-finish-load", () => {
    void win?.webContents.executeJavaScript(
      `document.getElementById('root') ? document.getElementById('root').innerHTML.length : -1`
    ).then((len) => {
      logDebug(`[did-finish-load] root innerHTML length = ${len}`);
    }).catch((err) => {
      logDebug(`[did-finish-load] executeJavaScript error: ${String(err)}`);
    });
  });

  if (isDev && DEV_SERVER_URL) {
    void win.loadURL(DEV_SERVER_URL);
    // DevTools 通过 F12 手动打开，开发时不再自动弹出
  } else {
    // electron-vite 构建产物在 out/renderer/index.html
    void win.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
  }

  // 外部链接在系统浏览器打开
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      void shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  initAutoUpdater(win);
}

function registerShortcuts(): void {
  // CmdOrCtrl+Shift+L 唤起 / 隐藏窗口
  globalShortcut.register("CommandOrControl+Shift+L", () => {
    if (!win) return;
    if (win.isFocused()) {
      win.hide();
    } else {
      win.show();
      win.focus();
    }
  });
}

function registerIpcHandlers(): void {
  // 文件系统
  ipcMain.handle("fs:save-file", (_e, fileName: string, content: string, defaultDir?: string) => {
    if (!win) return { saved: false, path: null };
    return saveFile(win, fileName, content, defaultDir);
  });
  ipcMain.handle("fs:open-folder", (_e, folderPath: string) => openFolder(folderPath));
  ipcMain.handle("fs:show-in-folder", (_e, fullPath: string) => showInFolder(fullPath));

  // 通知与托盘
  ipcMain.handle("notify:show", (_e, title: string, body: string) => {
    showNotification(title, body);
    return true;
  });
  ipcMain.handle("notify:set-tray", (_e, label: string) => {
    setTrayLabel(label);
    return true;
  });

  // 本地 AI 检测
  ipcMain.handle("ai:detect-ollama", (_e, apiBase?: string) => detectOllama(apiBase));
  ipcMain.handle("ai:list-local-models", (_e, apiBase?: string) => listLocalModels(apiBase));

  // 应用信息
  ipcMain.handle("app:get-version", () => app.getVersion());
  ipcMain.handle("app:open-external", (_e, url: string) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      void shell.openExternal(url);
      return true;
    }
    return false;
  });

  // 自定义窗口控制（无边框窗口）
  ipcMain.handle("window:minimize", () => {
    win?.minimize();
    return true;
  });
  ipcMain.handle("window:maximize-toggle", () => {
    if (!win) return false;
    if (win.isMaximized()) {
      win.unmaximize();
      return false;
    }
    win.maximize();
    return true;
  });
  ipcMain.handle("window:close", () => {
    win?.close();
    return true;
  });
  ipcMain.handle("window:is-maximized", () => !!win?.isMaximized());

  // 自动更新
  ipcMain.handle("updater:check", () => {
    checkForUpdates();
    return true;
  });
  ipcMain.handle("updater:download", () => {
    downloadUpdate();
    return true;
  });
  ipcMain.handle("updater:install", () => {
    installAndRestart();
    return true;
  });
}

// 单例锁：防止多开
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    // 开发态隐藏默认菜单
    if (isDev) Menu.setApplicationMenu(null);

    registerIpcHandlers();
    createWindow();

    tray = createTray("", () => {
      if (win) {
        win.isVisible() ? win.focus() : win.show();
      }
    });

    registerShortcuts();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else win?.show();
  });
}

app.on("window-all-closed", () => {
  // macOS 应用常驻
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  destroyTray();
  globalShortcut.unregisterAll();
});

// 渲染进程触发构建完成通知的便捷入口
ipcMain.handle("notify:build-done", (_e, title: string, body: string) => {
  showNotification(title, body, () => {
    win?.show();
    win?.focus();
  });
  return true;
});
