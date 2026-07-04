import { app, Notification, Tray, Menu, nativeImage, type MenuItemConstructorOptions } from "electron";
import path from "node:path";

/**
 * 系统通知与托盘服务
 *
 * - 系统通知：构建完成 / 错误时弹通知
 * - 托盘：常驻任务栏，点击显示主窗口，右键菜单提供快捷操作
 */

let tray: Tray | null = null;

/** 创建系统托盘。图标缺失时使用空图标占位，避免崩溃 */
export function createTray(iconPath: string, onClick: () => void): Tray | null {
  try {
    const img = iconPath ? nativeImage.createFromPath(iconPath) : nativeImage.createEmpty();
    if (img.isEmpty()) {
      // 没有真实图标时使用空图标（部分平台要求非空，这里尽力而为）
      const empty = nativeImage.createEmpty();
      tray = new Tray(empty);
    } else {
      tray = new Tray(img.resize({ width: 16, height: 16 }));
    }

    const menu = Menu.buildFromTemplate([
      { label: "显示主窗口", click: () => onClick() },
      { type: "separator" } as MenuItemConstructorOptions,
      { label: "检查更新", click: () => onClick() },
      { type: "separator" } as MenuItemConstructorOptions,
      { label: "退出", role: "quit" },
    ]);

    tray.setToolTip("妙想 - AI 产品构建器");
    tray.setContextMenu(menu);
    tray.on("click", () => onClick());
    return tray;
  } catch {
    return null;
  }
}

/** 弹出系统通知 */
export function showNotification(
  title: string,
  body: string,
  onClick?: () => void,
): void {
  if (!Notification.isSupported()) return;
  const n = new Notification({ title, body, silent: false });
  if (onClick) n.on("click", onClick);
  n.show();
}

/** 更新托盘提示文本 */
export function setTrayLabel(label: string): void {
  if (tray) {
    tray.setToolTip(`妙想 - ${label}`);
  }
}

/** 销毁托盘 */
export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

export { tray };

// 默认图标路径：开发态用 apps/desktop/build/icon.png；打包后用 process.resourcesPath/icon.png
export const DEFAULT_ICON = app.isPackaged
  ? path.join(process.resourcesPath, "icon.png")
  : path.join(app.getAppPath(), "build", "icon.png");
