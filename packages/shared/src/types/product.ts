/**
 * 产品类型定义 - LynxKit v1.0
 *
 * 8 类产品类型，覆盖 LynxKit 全部生成场景。
 * 与 constants/product-types.ts 中的 PRODUCT_TYPES 元数据保持同步。
 */

/**
 * 产品类型枚举（8 类）
 *
 * 枚举值与 packages/db/src/schema/build-sessions.ts 的 productTypeEnum 对齐（大写）。
 *
 * - SOCIAL：AI 社交（交友/匹配/陪伴/社群）
 * - SYSTEM：AI 系统（平台/中台/自动化）
 * - WORKSTATION：AI 工作站（工具/创作/知识管理）
 * - DATA：AI 数据分析（BI/报表/可视化/洞察）
 * - ADMIN：AI 管理后台（CRM/ERP/OA/运营）
 * - APP：AI 应用 App（小程序/移动端/客户端）
 * - MARKETING：AI 营销（广告/投放/增长/获客）
 * - HARDWARE：AI 硬件（IoT/智能家居/机器人）
 */
export enum ProductType {
	SOCIAL = "SOCIAL",
	SYSTEM = "SYSTEM",
	WORKSTATION = "WORKSTATION",
	DATA = "DATA",
	ADMIN = "ADMIN",
	APP = "APP",
	MARKETING = "MARKETING",
	HARDWARE = "HARDWARE",
}

/** ProductType 字符串字面量类型，便于序列化与索引签名 */
export type ProductTypeValue = `${ProductType}`;
