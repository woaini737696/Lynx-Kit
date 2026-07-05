/**
 * 管理后台路由聚合 - LynxKit API
 *
 * 所有子路由需 SUPER_ADMIN 或 ADMIN 角色（RBAC）。
 * 在本文件统一挂载 authMiddleware + requireAdmin 中间件，
 * 子路由文件无需重复挂载，按业务域拆分。
 *
 * 模块拆分（routes/admin/）：
 *   stats.ts         数据看板（用户/构建/收入统计）
 *   users.ts         用户管理（列表/搜索/筛选/更新/软删除）
 *   configs.ts       系统配置 + AI 模型 + Agent 配置
 *   store.ts         AI 应用商店管理
 *   builds.ts        构建会话 + 模板管理
 *   memberships.ts   会员管理（档位/开通/S 币调整/流水）
 *   roles-audit.ts   角色权限矩阵 + 审计日志
 *
 * 路由结构（全部前缀 /api/v1/admin）：
 *   GET    /admin/stats                          数据看板
 *   GET    /admin/users                          用户列表
 *   PATCH  /admin/users/:id                      更新用户
 *   DELETE /admin/users/:id                      软删除用户
 *   GET    /admin/configs                        系统配置
 *   PUT    /admin/configs/:key                   Upsert 系统配置
 *   DELETE /admin/configs/:key                   删除系统配置
 *   GET    /admin/store                          产品列表
 *   PATCH  /admin/store/:id                      更新产品
 *   DELETE /admin/store/:id                      删除产品
 *   GET    /admin/builds                         构建会话列表
 *   GET    /admin/builds/:id                     构建会话详情
 *   DELETE /admin/builds/:id                     删除构建会话
 *   GET    /admin/templates                      模板列表
 *   PATCH  /admin/templates/:id                 更新模板
 *   GET    /admin/ai-models                     AI 模型配置
 *   PUT    /admin/ai-models/:key                Upsert AI 模型配置
 *   DELETE /admin/ai-models/:key                删除 AI 模型配置
 *   GET    /admin/agents                         Agent 配置
 *   PUT    /admin/agents/:key                    Upsert Agent 配置
 *   DELETE /admin/agents/:key                    删除 Agent 配置
 *   GET    /admin/roles                          角色权限矩阵
 *   GET    /admin/audit                          审计日志
 *   GET    /admin/memberships/plans              会员档位
 *   GET    /admin/memberships                    会员管理列表
 *   POST   /admin/memberships/grant             手动开通会员
 *   POST   /admin/memberships/scoin/adjust      调整 S 币
 *   GET    /admin/memberships/scoin/transactions S 币流水
 */
import { Hono } from "hono";

import { authMiddleware } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/rbac.js";

import { statsRoutes } from "./admin/stats.js";
import { usersAdminRoutes } from "./admin/users.js";
import { configsRoutes } from "./admin/configs.js";
import { storeAdminRoutes } from "./admin/store.js";
import { buildsAdminRoutes } from "./admin/builds.js";
import { membershipsAdminRoutes } from "./admin/memberships.js";
import { rolesAuditRoutes } from "./admin/roles-audit.js";

export const adminRoutes = new Hono();

// 所有 admin 路由都需要登录 + ADMIN 角色（统一在聚合层挂载）
adminRoutes.use("*", authMiddleware, requireAdmin);

// 挂载子路由（路径不重复，可直接 route 挂载）
adminRoutes.route("/", statsRoutes);
adminRoutes.route("/", usersAdminRoutes);
adminRoutes.route("/", configsRoutes);
adminRoutes.route("/", storeAdminRoutes);
adminRoutes.route("/", buildsAdminRoutes);
adminRoutes.route("/", membershipsAdminRoutes);
adminRoutes.route("/", rolesAuditRoutes);
