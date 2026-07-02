import { contextBridge, ipcRenderer } from "electron";

/**
 * preload 安全桥接
 *
 * 通过 contextBridge.exposeInMainWorld 暴露受限的 electronAPI，
 * 渲染进程只能调用此处显式声明的方法，无法直接访问 Node / 主进程能力。
 * contextIsolation: true 保证页面 JS 无法污染 preload 上下文。
 */

type Listener<T = unknown> = (payload: T) => void;

const api = {
  filesystem: {
    /** 弹出保存对话框，将内容写入用户选择的本地文件 */
    saveFile: (fileName: string, content: string, defaultDir?: string) =>
      ipcRenderer.invoke("fs:save-file", fileName, content, defaultDir) as Promise<{
        saved: boolean;
        path: string | null;
        error?: string;
      }>,
    /** 在文件管理器中打开指定目录 */
    openFolder: (folderPath: string) =>
      ipcRenderer.invoke("fs:open-folder", folderPath) as Promise<boolean>,
    /** 在文件管理器中高亮定位到某个文件 */
    showInFolder: (fullPath: string) =>
      ipcRenderer.invoke("fs:show-in-folder", fullPath) as Promise<void>,
  },

  notification: {
    /** 弹出系统通知 */
    showNotification: (title: string, body: string) =>
      ipcRenderer.invoke("notify:show", title, body) as Promise<boolean>,
    /** 更新托盘提示文本 */
    setTray: (label: string) =>
      ipcRenderer.invoke("notify:set-tray", label) as Promise<boolean>,
    /** 构建完成通知（点击聚焦主窗口） */
    notifyBuildDone: (title: string, body: string) =>
      ipcRenderer.invoke("notify:build-done", title, body) as Promise<boolean>,
  },

  localAI: {
    /** 检测本机 Ollama 是否运行，并返回已安装本地模型 */
    detectOllama: (apiBase?: string) =>
      ipcRenderer.invoke("ai:detect-ollama", apiBase) as Promise<{
        running: boolean;
        apiBase: string;
        models: string[];
        error?: string;
      }>,
    /** 仅列出本地模型名称 */
    listLocalModels: (apiBase?: string) =>
      ipcRenderer.invoke("ai:list-local-models", apiBase) as Promise<string[]>,
  },

  app: {
    /** 获取应用版本号 */
    getVersion: () => ipcRenderer.invoke("app:get-version") as Promise<string>,
    /** 在系统浏览器中打开外链 */
    openExternal: (url: string) =>
      ipcRenderer.invoke("app:open-external", url) as Promise<boolean>,
  },

  window: {
    /** 最小化窗口 */
    minimize: () => ipcRenderer.invoke("window:minimize") as Promise<boolean>,
    /** 最大化 / 还原（返回当前是否最大化） */
    maximizeToggle: () => ipcRenderer.invoke("window:maximize-toggle") as Promise<boolean>,
    /** 关闭窗口 */
    close: () => ipcRenderer.invoke("window:close") as Promise<boolean>,
    /** 查询当前是否最大化 */
    isMaximized: () => ipcRenderer.invoke("window:is-maximized") as Promise<boolean>,
  },

  updater: {
    check: () => ipcRenderer.invoke("updater:check") as Promise<boolean>,
    download: () => ipcRenderer.invoke("updater:download") as Promise<boolean>,
    install: () => ipcRenderer.invoke("updater:install") as Promise<boolean>,
    /** 监听发现新版本 */
    onUpdateAvailable: (cb: Listener) => {
      const handler = (_e: unknown, info: unknown) => cb(info);
      ipcRenderer.on("updater:update-available", handler);
      return () => ipcRenderer.removeListener("updater:update-available", handler);
    },
    /** 监听下载进度 */
    onProgress: (cb: Listener<{ percent: number }>) => {
      const handler = (_e: unknown, p: { percent: number }) => cb(p);
      ipcRenderer.on("updater:progress", handler);
      return () => ipcRenderer.removeListener("updater:progress", handler);
    },
    /** 监听下载完成 */
    onDownloaded: (cb: Listener) => {
      const handler = () => cb(undefined);
      ipcRenderer.on("updater:downloaded", handler);
      return () => ipcRenderer.removeListener("updater:downloaded", handler);
    },
  },
} as const;

export type ElectronAPI = typeof api;

contextBridge.exposeInMainWorld("electronAPI", api);
