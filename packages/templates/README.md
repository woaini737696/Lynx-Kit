# @lynxkit/templates

LynxKit 用户产品模板库。每个模板对应一种产品类型，是用户用 LynxKit 平台创建产品时使用的基础代码骨架。平台不会从零生成代码，而是基于预验证的模板基座 + AI 配置填充来完成产品构建。

## 目录结构

```
packages/templates/
├── _base/                    # 所有模板共享的基础层（不直接发布）
│   ├── components/
│   │   ├── auth/            # 登录/注册/找回密码/用户菜单
│   │   ├── user/            # 用户中心：资料/密码/通知设置
│   │   ├── layout/          # 布局：AppShell/Header/Footer/Sidebar/BottomNav
│   │   ├── ui/              # 基础 UI：Button/Input/Modal/Toast/Card/Badge/Skeleton
│   │   └── data/            # 数据展示：DataTable/StatCard/Chart
│   ├── lib/                 # 工具库：auth/prisma/api/utils/storage/notify
│   ├── prisma/              # 通用 Prisma 数据模型
│   ├── Dockerfile           # 多阶段构建 + Caddy
│   ├── docker-compose.yml   # 通用编排
│   └── Caddyfile            # 自动 HTTPS + 反向代理
│
├── static-site/             # 品牌展示（完整基座）
├── service-booking/         # 服务预约（仅 template.json + 占位）
├── content-publish/         # 内容发布（仅 template.json + 占位）
├── light-commerce/          # 电商交易（仅 template.json + 占位）
├── event-manage/            # 活动管理（仅 template.json + 占位）
└── admin-dashboard/         # 管理后台（仅 template.json + 占位）
```

## 6 大预设架构模板

| 模板 ID | 名称 | 技术栈 | 适用场景 |
|---------|------|--------|----------|
| `static-site` | 品牌展示 | Next.js 15 + Tailwind + Caddy | 个人官网、作品集、企业官网、落地页 |
| `service-booking` | 服务预约 | Next.js 15 + PostgreSQL + PWA | 教练预约、美容理疗、摄影档期、咨询预约 |
| `content-publish` | 内容发布 | Next.js 15 + PostgreSQL + MDX | 个人博客、知识库、newsletter、文档站 |
| `light-commerce` | 电商交易 | Next.js 15 + PostgreSQL + Stripe | 手作商城、知识付费、会员订阅、虚拟商品 |
| `event-manage` | 活动管理 | Next.js 15 + PostgreSQL + PWA | 活动报名、会议签到、课程管理、聚会组织 |
| `admin-dashboard` | 管理后台 | Next.js 15 + PostgreSQL + shadcn/ui | 内部工具、客户管理、数据看板、CRM |

## _base 共享层使用方式

`_base/` 是所有模板的共享代码层，**不会被发布为独立 npm 包**。使用方式：

1. **平台复制**：用户创建产品时，平台将 `_base/` 下的相关文件复制到用户项目对应目录
2. **按需复制**：模板自行声明依赖哪些 `_base` 组件，平台按声明复制
3. **路径约定**：复制后通过 `@/_base/components/*` 引用
4. **配置注入**：业务变化通过 `config.ts` 读取，不动代码骨架

例如，static-site 模板的组件引用：
```tsx
import { Button } from "@/_base/components/ui/Button";
import { Header } from "@/_base/components/layout/Header";
```

## template.json 标准格式

每个模板根目录必须包含 `template.json`，定义元数据 + 问题配置：

```json
{
  "id": "模板唯一标识",
  "name": "模板显示名称",
  "description": "一句话描述",
  "architecture": "架构标签",
  "version": "1.0.0",
  "features": ["功能1", "功能2"],
  "screenshots": [],
  "questions": [
    {
      "id": "变量名",
      "question": "问题文案？",
      "type": "text|textarea|select|multi-select|color-select|time-range|number|image",
      "required": true,
      "placeholder": "占位提示（可选）",
      "default": "默认值（可选）",
      "options": ["选项数组（select/multi-select/color-select 必填）"]
    }
  ],
  "configMapping": {
    "问题id": "config.路径.字段"
  }
}
```

`questions` 中的占位符格式为 `{{variableName}}`，AI 在填充 `config.ts` 时会替换为用户实际回答值。

## 如何添加新模板

1. 在 `packages/templates/` 下创建新目录，命名为模板 ID（kebab-case）
2. 编写 `template.json`，按上述格式定义元数据与问题
3. 创建 `src/` 业务代码目录与 `extends/` 扩展点目录
4. 在 `src/lib/config.ts` 中定义配置占位符（用 `{{varName}}` 包裹）
5. 业务组件从 `@/_base/components/*` 引用通用组件
6. 在本 README 的模板表格中补充新模板信息

## 设计原则

- **预验证**：入库前必须可编译、可运行
- **配置驱动**：业务变化通过 `config.ts` 实现，不动代码骨架
- **通用集成**：登录、注册、用户管理等能力内置
- **版本管理**：每个模板带 `version` 字段，支持升级和回滚
- **扩展点预留**：`extends/` 目录用于高级用户自定义
