/**
 * 运行时配置
 * 占位符 {{variableName}} 在 AI 填充时被替换为用户实际回答值
 *
 * 业务方接入后可扩展，但请保持字段名稳定以兼容模板代码
 */

export const config = {
  serviceName: "{{serviceName}}",
  heroTitle: "{{heroTitle}}",
  heroSubtitle: "{{heroSubtitle}}",
  theme: {
    primaryColor: "{{primaryColor}}",
  },
  about: {
    text: "{{aboutText}}",
  },
  services: "{{services}}",
  portfolioItems: "{{portfolioItems}}",
  contact: {
    phone: "{{contactPhone}}",
    email: "{{contactEmail}}",
  },
};

export type SiteConfig = typeof config;
