/**
 * Electron IPC 桥接
 *
 * 检测当前是否运行在 Electron 桌面端容器内，并重新导出 preload 注入的 electronAPI。
 * 所有需要访问本地文件 / 系统通知 / 本地 AI / 自动更新的代码，都应通过此模块访问，
 * 以便在纯 Web 环境（无 electronAPI）下优雅降级。
 */

interface ElectronApiShape {
  filesystem: {
    saveFile: (
      fileName: string,
      content: string,
      defaultDir?: string,
    ) => Promise<{ saved: boolean; path: string | null; error?: string }>;
    openFolder: (folderPath: string) => Promise<boolean>;
    showInFolder: (fullPath: string) => Promise<void>;
  };
  notification: {
    showNotification: (title: string, body: string) => Promise<boolean>;
    setTray: (label: string) => Promise<boolean>;
    notifyBuildDone: (title: string, body: string) => Promise<boolean>;
  };
  localAI: {
    detectOllama: (apiBase?: string) => Promise<{
      running: boolean;
      apiBase: string;
      models: string[];
      error?: string;
    }>;
    listLocalModels: (apiBase?: string) => Promise<string[]>;
  };
  app: {
    getVersion: () => Promise<string>;
    openExternal: (url: string) => Promise<boolean>;
  };
  updater: {
    check: () => Promise<boolean>;
    download: () => Promise<boolean>;
    install: () => Promise<boolean>;
    onUpdateAvailable: (cb: (info: unknown) => void) => () => void;
    onProgress: (cb: (p: { percent: number }) => void) => () => void;
    onDownloaded: (cb: () => void) => () => void;
  };
}

declare global {
  interface Window {
    electronAPI?: ElectronApiShape;
  }
}

/** 是否在 Electron 桌面端中运行 */
export const isElectron =
  typeof window !== "undefined" && window.electronAPI !== undefined;

/** preload 暴露的 API（在纯 Web 环境下为 null） */
export const electronAPI: ElectronApiShape | null = isElectron
  ? window.electronAPI!
  : null;

/**
 * 安全调用 electronAPI 的辅助函数。
 * 在非 Electron 环境下返回 null，避免调用方逐处判空。
 */
export async function withElectron<T>(
  fn: (api: ElectronApiShape) => Promise<T>,
): Promise<T | null> {
  if (!electronAPI) return null;
  return fn(electronAPI);
}
