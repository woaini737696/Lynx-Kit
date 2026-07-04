import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@lynxkit/store";

/**
 * 路由守卫
 *
 * 未登录用户访问受保护路由时，重定向到 /login 并携带原始路径，
 * 登录成功后可回到原页面。
 */
export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
