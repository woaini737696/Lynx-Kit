import * as React from "react";

/**
 * 用户菜单组件
 * 显示当前登录用户的头像 + 下拉菜单（资料 / 设置 / 退出登录）
 */

export interface CurrentUser {
  id: string;
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
}

export interface UserMenuProps {
  user?: CurrentUser | null;
  onProfile?: () => void;
  onSettings?: () => void;
  onSignOut?: () => void;
  onSignIn?: () => void;
}

export function UserMenu({
  user,
  onProfile,
  onSettings,
  onSignOut,
  onSignIn,
}: UserMenuProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) {
    return (
      <button
        type="button"
        onClick={onSignIn}
        className="rounded-md px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50"
      >
        登录
      </button>
    );
  }

  const initial = (user.name || user.email || "U").charAt(0).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-medium text-blue-700"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar}
            alt={user.name || "用户头像"}
            className="h-full w-full object-cover"
          />
        ) : (
          initial
        )}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg"
        >
          <div className="border-b border-gray-100 px-3 py-2">
            <div className="truncate text-sm font-medium text-gray-900">
              {user.name || "未命名"}
            </div>
            <div className="truncate text-xs text-gray-500">
              {user.email || ""}
            </div>
          </div>
          {onProfile && (
            <MenuItem label="个人资料" onClick={() => runAndClose(onProfile)} />
          )}
          {onSettings && (
            <MenuItem label="账号设置" onClick={() => runAndClose(onSettings)} />
          )}
          <MenuItem
            label="退出登录"
            danger
            onClick={() => runAndClose(onSignOut)}
          />
        </div>
      )}
    </div>
  );

  function runAndClose(fn?: () => void) {
    setOpen(false);
    fn?.();
  }
}

function MenuItem({
  label,
  onClick,
  danger,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={[
        "block w-full px-3 py-2 text-left text-sm hover:bg-gray-50",
        danger ? "text-red-600" : "text-gray-700",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
