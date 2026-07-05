import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@lynxkit/store";
import { useAuthModal } from "@/store/auth-modal";

/**
 * 路由守卫
 *
 * 未登录用户访问受保护路由时：
 *   - 打开全屏 AuthModal（携带原路径作为 intendedPath）
 *   - 渲染 null（弹窗遮罩覆盖底层，无需显示空白受保护页）
 *
 * 登录成功后 AuthModal 读取 intendedPath 并 navigate 回原页面。
 */
export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();
  const openAuthModal = useAuthModal((s) => s.openAuthModal);

  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal("login", location.pathname);
    }
  }, [isAuthenticated, openAuthModal, location.pathname]);

  if (!isAuthenticated) return null;

  return <Outlet />;
}
