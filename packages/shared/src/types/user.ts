/**
 * 用户类型定义 - LynxKit v1.0
 */

/**
 * 用户角色枚举
 *
 * 枚举值与 packages/db/src/schema/users.ts 的 pgEnum 对齐（大写）。
 * 这是唯一真相源，禁止在其他地方维护小写值。
 *
 * - USER：普通用户
 * - CREATOR：创作者（可上架商店产品）
 * - ADMIN：平台管理员
 * - SUPER_ADMIN：超级管理员
 */
export enum UserRole {
	USER = "USER",
	CREATOR = "CREATOR",
	ADMIN = "ADMIN",
	SUPER_ADMIN = "SUPER_ADMIN",
}

/**
 * 用户状态枚举
 *
 * 枚举值与 packages/db/src/schema/users.ts 的 pgEnum 对齐（大写）。
 *
 * - ACTIVE：正常
 * - SUSPENDED：已封禁
 * - DELETED：已注销
 */
export enum UserStatus {
	ACTIVE = "ACTIVE",
	SUSPENDED = "SUSPENDED",
	DELETED = "DELETED",
}

/**
 * 平台用户主体
 */
export interface User {
	/** 用户 ID（cuid） */
	id: string;
	/** 邮箱（可选联系方式，不再用于登录） */
	email?: string;
	/** 用户名 */
	name?: string;
	/** 头像 URL */
	avatar?: string;
	/** 手机号（登录主标识，中国大陆 11 位） */
	phone: string;
	/** 角色 */
	role: UserRole;
	/** 状态 */
	status: UserStatus;
	/** 创建时间（ISO 字符串） */
	createdAt: string;
	/** 更新时间（ISO 字符串） */
	updatedAt: string;
}

/**
 * 用户公开信息（脱敏后供其他用户查看）
 */
export interface UserProfile {
	/** 用户 ID */
	id: string;
	/** 用户名 */
	name?: string;
	/** 头像 URL */
	avatar?: string;
	/** 角色 */
	role: UserRole;
}
