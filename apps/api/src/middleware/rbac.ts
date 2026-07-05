/**
 * RBAC 中间件 - 基于角色的访问控制
 *
 * 在 authMiddleware 之后使用，校验当前用户是否拥有所需角色。
 *
 * 用法：
 *   app.use('/api/v1/admin/*', authMiddleware, requireRole(['SUPER_ADMIN', 'ADMIN']));
 *
 * 权限层级（从高到低）：
 *   SUPER_ADMIN > ADMIN > CREATOR > USER
 */
import type { MiddlewareHandler } from "hono";

import { getCurrentUser } from "./auth.js";
import { ForbiddenError } from "./error.js";

/**
 * 校验当前用户是否拥有指定角色之一
 *
 * @param allowedRoles 允许的角色列表（满足其一即可）
 */
export function requireRole(allowedRoles: string[]): MiddlewareHandler {
  return async (c, next) => {
    const user = getCurrentUser(c);
    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenError(
        `权限不足：需要 ${allowedRoles.join(" 或 ")} 角色，当前角色为 ${user.role}`,
      );
    }
    await next();
  };
}

/**
 * 仅允许 SUPER_ADMIN
 */
export const requireSuperAdmin = requireRole(["SUPER_ADMIN"]);

/**
 * 允许 SUPER_ADMIN 和 ADMIN
 */
export const requireAdmin = requireRole(["SUPER_ADMIN", "ADMIN"]);
