# Lynx Kit 产品方案 v0.2

> **产品愿景**：人人都是超级个体  
> **一句话定位**：不会代码，也能独立做产品  
> **目标用户**：0技术基础的产品经理、自由职业者、一人公司老板  
> **核心差异**：用户只管说需求，平台自动选架构、选模板、生成代码、一键部署

---

## 目录

1. [产品定位](#1-产品定位)
2. [核心设计原则](#2-核心设计原则)
3. [技术架构自动选择体系](#3-技术架构自动选择体系)
4. [模板基座体系](#4-模板基座体系)
5. [多端适配方案](#5-多端适配方案)
6. [通用功能封装库](#6-通用功能封装库)
7. [用户旅程](#7-用户旅程)
8. [Agent编排引擎](#8-agent编排引擎)
9. [数据模型](#9-数据模型)
10. [安全架构](#10-安全架构)
11. [扩展性规划](#11-扩展性规划)
12. [四周迭代路线](#12-四周迭代路线)
13. [关键指标](#13-关键指标)

---

## 1. 产品定位

### 1.1 用户画像

| 属性 | 描述 |
|------|------|
| 职业 | 产品经理、自由职业者、咨询师、设计师、教练、小商家 |
| 技术能力 | 完全不懂代码，不会用GitHub，没听过Docker |
| 核心痛点 | 有想法、有客户，但做不出线上产品，外包贵且沟通成本高 |
| 付费动机 | 生产资料投资，直接关联收入 |
| 决策速度 | 快，自己说了算 |

### 1.2 产品边界

**Lynx Kit 做**：
- 根据用户业务需求，自动选择最优技术架构
- 提供预验证的模板基座，AI 填充配置而非从零生成
- 一键部署到用户自有服务器
- 智能修复编译和逻辑错误

**Lynx Kit 不做**：
- 不托管用户数据（用户数据在用户自己的服务器）
- 不做复杂定制开发（超出模板能力范围的需求引导用户找外包）
- 不做原生 App 上架（提供 PWA/H5/小程序，不上架 App Store）

---

## 2. 核心设计原则

### 2.1 六条铁律

| 原则 | 说明 | 产品体现 |
|------|------|----------|
| **架构透明** | 用户永远看不到技术选项，平台自动决策 | 没有"选前端框架"的界面 |
| **模板优先** | 所有产品基于预验证模板，AI 只改配置 | 错误率降低 80%，可回滚 |
| **多端一体** | 一次创建，同时生成 Web + 移动端适配 | 用户说"我要一个预约系统"，同时得到网站 + 手机页面 |
| **通用复用** | 登录、注册、用户管理、权限等全部封装 | 用户产品自带这些能力，无需重复配置 |
| **零运维** | 用户只管用，平台负责部署和修复 | 用户不知道什么是 Docker、SSL、数据库 |
| **渐进增强** | MVP 极简，高级功能可插拔 | 先跑通核心链路，再扩展模板库 |

---

## 3. 技术架构自动选择体系

### 3.1 核心设计：用户无感知，平台自动决策

用户输入："我要做一个瑜伽预约系统"  
平台输出：自动选择 **Service-Booking 架构模板**（Next.js + PostgreSQL + PWA）

**用户全程看不到任何技术选项。**

### 3.2 预设架构矩阵

平台内置 6 大类预设架构，覆盖 90% 的独立产品需求：

| 产品类型 | 自动选择架构 | 技术栈 | 适用场景 |
|----------|-------------|--------|----------|
| **品牌展示类** | Static-Site | Next.js + Tailwind + Caddy | 个人官网、作品集、企业官网 |
| **服务预约类** | Service-Booking | Next.js + PostgreSQL + PWA | 教练预约、美容预约、咨询预约 |
| **内容发布类** | Content-Publish | Next.js + PostgreSQL + MDX | 博客、知识库、 newsletter |
| **电商交易类** | Light-Commerce | Next.js + PostgreSQL + Stripe | 手作商城、知识付费、会员订阅 |
| **活动管理类** | Event-Manage | Next.js + PostgreSQL + PWA | 活动报名、会议管理、课程管理 |
| **管理后台类** | Admin-Dashboard | Next.js + PostgreSQL + shadcn/ui | 内部工具、客户管理、数据看板 |

### 3.3 架构模板详细定义

#### 3.3.1 Static-Site（品牌展示）

```
架构标签：static
适用场景：个人官网、作品集、企业官网、落地页

技术栈：
  前端：Next.js 15 App Router + Tailwind CSS + shadcn/ui
  后端：无（纯静态，或 Server Actions 处理表单）
  数据库：无（或 SQLite 轻量存储联系表单）
  部署：Caddy 静态托管 + 自动 SSL
  性能：SSG 预渲染，首屏 < 1s
  SEO：原生支持，自动生成 sitemap

模板基座包含：
  - 首页 Hero 区块
  - 关于我/关于我们
  - 服务/产品介绍
  - 作品集/案例展示
  - 联系方式 + 地图
  - 页脚（社交链接、备案信息）

通用功能集成：
  - 联系表单（数据存入平台数据库或发送到用户邮箱）
  - 访问统计（简单 PV/UV，无用户追踪）
  - 分享卡片（Open Graph 自动生成）
```

#### 3.3.2 Service-Booking（服务预约）

```
架构标签：booking
适用场景：教练预约、美容理疗、摄影档期、咨询预约

技术栈：
  前端：Next.js 15 App Router + Tailwind CSS + shadcn/ui
  后端：Next.js API Routes + tRPC
  数据库：PostgreSQL 16（Docker Compose 一键启动）
  ORM：Prisma
  部署：Docker Compose + Caddy 反向代理 + 自动 SSL
  移动端：PWA（可添加到主屏幕，离线缓存）

模板基座包含：
  - 首页（服务介绍 + 预约入口）
  - 预约页（时段选择 + 表单提交）
  - 管理后台（预约列表 + 状态管理 + 日历视图）
  - 用户端（我的预约 + 取消/改期）

通用功能集成：
  - 用户注册/登录（邮箱 + 手机验证码）
  - 时段管理（可预约时间设置、冲突检测）
  - 预约通知（邮件/短信，接入第三方服务）
  - 数据导出（Excel 导出预约记录）

业务逻辑封装：
  - 预约冲突检测算法
  - 时段自动释放（过期未确认自动释放）
  - 重复预约限制
  - 黑名单管理
```

#### 3.3.3 Content-Publish（内容发布）

```
架构标签：content
适用场景：个人博客、知识库、newsletter、文档站

技术栈：
  前端：Next.js 15 + Tailwind + MDX
  后端：Next.js API Routes
  数据库：PostgreSQL
  内容：MDX 格式，支持 Markdown + React 组件
  部署：Docker Compose + Caddy
  移动端：响应式 + PWA

模板基座包含：
  - 文章列表页（分类 + 标签 + 搜索）
  - 文章详情页（目录导航 + 代码高亮 + 评论）
  - 作者页
  - 订阅页（邮箱订阅）
  - 管理后台（文章编辑 + 发布 + 草稿）

通用功能集成：
  - 富文本编辑器（Markdown + 图片上传）
  - 文章分类/标签管理
  - 阅读统计
  - RSS 自动生成
  - SEO 自动优化（标题、描述、结构化数据）
```

#### 3.3.4 Light-Commerce（轻量电商）

```
架构标签：commerce
适用场景：手作商城、知识付费、会员订阅、虚拟商品

技术栈：
  前端：Next.js 15 + Tailwind + shadcn/ui
  后端：Next.js API Routes + tRPC
  数据库：PostgreSQL
  支付：Stripe（国际）/ 微信支付（国内，配置化接入）
  部署：Docker Compose + Caddy
  移动端：PWA + 响应式

模板基座包含：
  - 商品列表页（分类 + 筛选 + 搜索）
  - 商品详情页（多图 + 规格选择 + 库存）
  - 购物车 + 结算页
  - 订单管理（用户端 + 管理后台）
  - 管理后台（商品上架 + 库存 + 订单处理）

通用功能集成：
  - 用户注册/登录
  - 地址管理
  - 支付接入（配置 API Key 即可）
  - 订单状态机（待支付 → 已支付 → 处理中 → 已完成）
  - 库存扣减（并发安全）
  - 简单优惠券系统

限制说明：
  - 不支持多商户
  - 不支持复杂物流追踪
  - 不支持直播带货
```

#### 3.3.5 Event-Manage（活动管理）

```
架构标签：event
适用场景：活动报名、会议签到、课程管理、聚会组织

技术栈：
  前端：Next.js 15 + Tailwind + shadcn/ui
  后端：Next.js API Routes + tRPC
  数据库：PostgreSQL
  部署：Docker Compose + Caddy
  移动端：PWA

模板基座包含：
  - 活动列表页（时间线 + 分类）
  - 活动详情页（介绍 + 报名按钮 + 地图）
  - 报名表单（自定义字段）
  - 签到页（二维码/手动签到）
  - 管理后台（活动创建 + 报名管理 + 签到统计）

通用功能集成：
  - 用户注册/登录
  - 报名名额限制（先到先得/审核制）
  - 报名确认邮件
  - 二维码签到（生成 + 扫描）
  - 数据导出（报名名单 Excel）
  - 重复报名检测
```

#### 3.3.6 Admin-Dashboard（管理后台）

```
架构标签：admin
适用场景：内部工具、客户管理、数据看板、CRM 轻量版

技术栈：
  前端：Next.js 15 + Tailwind + shadcn/ui（Admin 专用深色主题）
  后端：Next.js API Routes + tRPC
  数据库：PostgreSQL
  图表：Recharts（简单图表）
  部署：Docker Compose + Caddy
  移动端：响应式（管理后台以桌面端为主）

模板基座包含：
  - 登录页
  - 仪表盘（数据卡片 + 简单图表）
  - 数据表格（CRUD + 筛选 + 排序 + 分页）
  - 表单页（创建/编辑）
  - 详情页
  - 设置页

通用功能集成：
  - 用户/角色/权限管理（RBAC）
  - 操作日志
  - 数据导入/导出（CSV/Excel）
  - 通知中心
  - 主题切换（浅色/深色）
```

### 3.4 架构选择决策树

```
用户输入需求
    │
    ├─ 关键词匹配："预约""档期""时间" → Service-Booking
    ├─ 关键词匹配："商城""卖""购买""商品" → Light-Commerce
    ├─ 关键词匹配："文章""博客""内容"" newsletter" → Content-Publish
    ├─ 关键词匹配："活动""报名""签到""会议" → Event-Manage
    ├─ 关键词匹配："管理""后台""CRM""数据""看板" → Admin-Dashboard
    └─ 默认（无匹配）→ Static-Site
    │
    ▼
确认产品类型后，锁定对应架构模板
后续所有操作（问题澄清、代码生成、部署）都基于该架构
```

---

## 4. 模板基座体系

### 4.1 模板设计原则

1. **预验证**：每个模板基座在入库前经过完整测试，保证可编译、可运行
2. **配置驱动**：业务变化通过 JSON 配置实现，不动代码骨架
3. **通用集成**：登录、注册、用户管理等通用能力内置于模板，用户无感知
4. **版本管理**：模板有版本号，支持升级和回滚
5. **扩展点预留**：模板预留插件扩展点，高级用户可自定义

### 4.2 模板目录结构

```
src/server/templates/
├── _base/                          # 所有模板共享的基础层
│   ├── components/
│   │   ├── auth/                   # 登录/注册/找回密码（通用）
│   │   ├── user/                   # 用户中心（通用）
│   │   ├── layout/                 # 布局组件（Header/Footer/Sidebar）
│   │   └── ui/                     # 基础 UI 组件（Button/Input/Modal/Toast）
│   ├── lib/
│   │   ├── auth.ts                 # 认证逻辑（NextAuth.js 封装）
│   │   ├── prisma.ts               # 数据库连接（Prisma 单例）
│   │   ├── api.ts                  # API 调用封装
│   │   └── utils.ts                # 工具函数
│   ├── prisma/
│   │   └── base.schema.prisma      # 通用数据模型（User/Session/Account）
│   ├── docker-compose.yml          # 通用 Docker 编排
│   ├── Dockerfile                  # 通用 Dockerfile
│   └── Caddyfile                   # 通用 Caddy 配置
│
├── static-site/                    # 品牌展示模板
│   ├── template.json               # 模板元数据 + 问题配置
│   ├── src/
│   │   ├── app/                    # 页面路由
│   │   ├── components/             # 业务组件（Hero/About/Portfolio/Contact）
│   │   └── lib/
│   │       └── config.ts           # 运行时配置读取
│   └── extends/                    # 扩展点（预留）
│
├── service-booking/                # 服务预约模板
│   ├── template.json
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   │   ├── booking/            # 预约相关组件
│   │   │   ├── admin/              # 管理后台组件
│   │   │   └── calendar/           # 日历组件
│   │   └── lib/
│   │       ├── config.ts
│   │       └── booking.ts          # 预约业务逻辑
│   └── extends/
│
├── content-publish/                # 内容发布模板
├── light-commerce/               # 轻量电商模板
├── event-manage/                 # 活动管理模板
└── admin-dashboard/              # 管理后台模板
```

### 4.3 模板元数据（template.json）标准格式

```json
{
  "id": "service-booking",
  "name": "服务预约",
  "description": "客户在线预约你的服务时间",
  "architecture": "booking",
  "version": "1.0.0",
  "features": ["预约", "时段管理", "通知"],
  "screenshots": ["home.png", "booking.png", "admin.png"],
  "questions": [
    {
      "id": "serviceName",
      "question": "服务名称/品牌名？",
      "type": "text",
      "required": true,
      "placeholder": "Sarah 瑜伽工作室"
    },
    {
      "id": "serviceType",
      "question": "服务类型？",
      "type": "select",
      "required": true,
      "options": ["一对一咨询", "美容理疗", "摄影拍摄", "课程培训"]
    },
    {
      "id": "heroTitle",
      "question": "首页大标题",
      "type": "text",
      "required": true,
      "default": "{serviceName}"
    },
    {
      "id": "heroSubtitle",
      "question": "副标题",
      "type": "text",
      "required": false,
      "placeholder": "专注流瑜伽与冥想"
    },
    {
      "id": "primaryColor",
      "question": "主色调偏好？",
      "type": "color-select",
      "required": true,
      "options": [
        { "label": "暖橙", "value": "#FF6B35" },
        { "label": "深蓝", "value": "#1e40af" },
        { "label": "墨绿", "value": "#065f46" },
        { "label": "玫红", "value": "#be185d" },
        { "label": "黑白", "value": "#111827" }
      ]
    },
    {
      "id": "workDays",
      "question": "可预约工作日？",
      "type": "multi-select",
      "required": true,
      "options": ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
    },
    {
      "id": "workHours",
      "question": "可预约时段？",
      "type": "time-range",
      "required": true,
      "default": { "start": "09:00", "end": "18:00" }
    },
    {
      "id": "duration",
      "question": "单次服务时长？",
      "type": "select",
      "required": true,
      "options": ["30分钟", "1小时", "1.5小时", "2小时"]
    },
    {
      "id": "price",
      "question": "单次服务价格（元）？",
      "type": "number",
      "required": false,
      "placeholder": "299"
    },
    {
      "id": "description",
      "question": "服务描述",
      "type": "textarea",
      "required": false,
      "placeholder": "简单描述你的服务内容和特色..."
    },
    {
      "id": "contactPhone",
      "question": "联系电话",
      "type": "text",
      "required": true,
      "placeholder": "13800138000"
    },
    {
      "id": "contactWechat",
      "question": "微信号（选填）",
      "type": "text",
      "required": false
    },
    {
      "id": "logo",
      "question": "上传 Logo",
      "type": "image",
      "required": false
    }
  ],
  "configMapping": {
    "serviceName": "config.serviceName",
    "heroTitle": "config.heroTitle",
    "primaryColor": "config.theme.primaryColor",
    "workDays": "config.booking.workDays",
    "workHours": "config.booking.workHours",
    "duration": "config.booking.duration",
    "price": "config.booking.price",
    "description": "config.about.text",
    "contactPhone": "config.contact.phone",
    "contactWechat": "config.contact.wechat",
    "logo": "config.brand.logo"
  }
}
```

### 4.4 配置映射系统

用户回答问题后，平台自动生成标准化配置对象，AI 填充时按映射路径注入：

```typescript
// 生成的 config 对象示例
const config = {
  serviceName: "Sarah 瑜伽工作室",
  heroTitle: "Sarah 瑜伽工作室",
  heroSubtitle: "专注流瑜伽与冥想",
  theme: {
    primaryColor: "#FF6B35",
    secondaryColor: "#FFF5F0",
    fontFamily: "system-ui",
  },
  booking: {
    workDays: ["周一", "周二", "周三", "周四", "周五"],
    workHours: { start: "09:00", end: "18:00" },
    duration: "1小时",
    price: 299,
    advanceBookingDays: 7,
  },
  about: {
    text: "瑜伽教练，10年经验...",
  },
  contact: {
    phone: "13800138000",
    wechat: "sarah_yoga",
  },
  brand: {
    logo: "https://cdn.lynx.run/xxx/logo.png",
  },
};
```

---

## 5. 多端适配方案

### 5.1 核心设计：一次创建，多端输出

用户创建产品时，平台同时生成：
- **Web 端**：响应式网站，桌面 + 平板 + 手机浏览器
- **PWA**：可添加到手机主屏幕，离线缓存，推送通知
- **管理后台**：桌面端为主，响应式适配平板

**不上架原生 App Store**，降低用户成本和平台复杂度。

### 5.2 各端技术方案

#### 5.2.1 Web 端（主入口）

```
技术：Next.js 15 App Router + Tailwind CSS
适配：响应式（Mobile First）
断点：sm(640px) / md(768px) / lg(1024px) / xl(1280px)

特性：
  - SSR/SSG 预渲染，SEO 友好
  - 图片自动优化（next/image）
  - 字体自动优化（next/font）
  - 路由预加载
```

#### 5.2.2 PWA（移动端体验）

```
技术：Next.js PWA 插件（next-pwa）

特性：
  - Web App Manifest（图标、主题色、启动画面）
  - Service Worker（离线缓存核心页面）
  - 添加到主屏幕（Add to Home Screen）
  - 推送通知（通过 Web Push API）
  - 后台同步（预约提醒等）

manifest.json 自动生成：
  - 名称：用户产品名
  - 图标：用户 Logo 或默认图标
  - 主题色：用户选择的主色调
  - 启动画面：自动生成
```

#### 5.2.3 管理后台（桌面端为主）

```
技术：Next.js + shadcn/ui（Admin 专用主题）
布局：Sidebar + Header + Content

特性：
  - 深色/浅色主题切换
  - 数据表格（筛选、排序、分页、导出）
  - 表单（验证、自动保存）
  - 图表（Recharts，简单数据可视化）
  - 响应式：平板可用，手机简化
```

### 5.3 多端组件封装

平台提供统一的多端组件库，模板直接引用：

```typescript
// 组件库目录
src/server/templates/_base/components/
├── ui/                           # 基础 UI（跨端通用）
│   ├── Button.tsx                # 按钮（支持移动端触摸优化）
│   ├── Input.tsx                 # 输入框
│   ├── Select.tsx                # 选择器
│   ├── Modal.tsx                 # 弹窗（移动端全屏，桌面端居中）
│   ├── Toast.tsx                 # 轻提示
│   ├── Card.tsx                  # 卡片
│   ├── Avatar.tsx                # 头像
│   ├── Badge.tsx                 # 标签
│   └── Skeleton.tsx              # 加载骨架
│
├── layout/                       # 布局组件
│   ├── AppShell.tsx              # 应用外壳（移动端底部导航，桌面端侧边栏）
│   ├── Header.tsx                # 顶部导航（响应式汉堡菜单）
│   ├── Footer.tsx                # 页脚
│   ├── Sidebar.tsx               # 侧边栏（管理后台）
│   └── BottomNav.tsx             # 底部导航（移动端）
│
├── auth/                         # 认证组件（通用）
│   ├── LoginForm.tsx             # 登录表单
│   ├── RegisterForm.tsx          # 注册表单
│   ├── ForgotPassword.tsx        # 找回密码
│   └── UserMenu.tsx              # 用户菜单（头像下拉）
│
├── user/                         # 用户中心（通用）
│   ├── ProfileForm.tsx           # 资料编辑
│   ├── PasswordChange.tsx        # 修改密码
│   └── NotificationSettings.tsx  # 通知设置
│
└── data/                         # 数据展示（通用）
    ├── DataTable.tsx             # 数据表格（管理后台）
    ├── StatCard.tsx              # 统计卡片
    └── Chart.tsx                 # 图表封装
```

### 5.4 响应式规则

```css
/* 移动端优先 */
.container {
  padding: 16px;           /* 移动端 */
}

@media (min-width: 768px) {
  .container {
    padding: 24px;         /* 平板 */
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 32px;         /* 桌面 */
    max-width: 1200px;
    margin: 0 auto;
  }
}

/* 导航栏 */
.mobile-nav { display: flex; }      /* 移动端：底部导航 */
.desktop-nav { display: none; }    /* 移动端：隐藏顶部导航 */

@media (min-width: 1024px) {
  .mobile-nav { display: none; }     /* 桌面端：隐藏底部导航 */
  .desktop-nav { display: flex; }    /* 桌面端：显示顶部导航 */
}

/* 表单 */
.form-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;        /* 移动端：单列 */
}

@media (min-width: 768px) {
  .form-grid {
    grid-template-columns: repeat(2, 1fr);  /* 平板：两列 */
  }
}
```

---

## 6. 通用功能封装库

### 6.1 设计原则

所有 Lynx Kit 生成的用户产品，**默认自带以下通用功能**，用户无需配置：

### 6.2 通用功能清单

#### 6.2.1 用户认证体系

```
功能：
  - 用户注册（邮箱 + 密码）
  - 用户登录（邮箱 + 密码）
  - 手机验证码登录（配置短信服务商后启用）
  - 密码找回（邮件重置链接）
  - 密码修改
  - 账号注销

技术实现：
  - NextAuth.js v5（Auth.js）
  - 支持 Credentials Provider（邮箱密码）
  - 支持 Email Provider（ magic link ）
  - JWT Session 策略
  - 密码 bcrypt 加密

数据模型：
  model User {
    id        String    @id @default(cuid())
    email     String    @unique
    name      String?
    avatar    String?
    phone     String?   @unique
    role      String    @default("user")  // user, admin
    status    String    @default("active") // active, suspended
    createdAt DateTime  @default(now())
    updatedAt DateTime  @updatedAt
  }
```

#### 6.2.2 用户管理（管理后台）

```
功能：
  - 用户列表（搜索、筛选、分页）
  - 用户详情查看
  - 用户状态管理（启用/禁用）
  - 角色分配（普通用户/管理员）
  - 用户数据导出

权限控制：
  - RBAC（Role-Based Access Control）
  - 角色：super_admin / admin / user
  - 权限矩阵：
    - super_admin：所有权限
    - admin：管理用户、查看数据、不能删除系统配置
    - user：仅操作自己的数据
```

#### 6.2.3 文件上传/存储

```
功能：
  - 图片上传（头像、Logo、作品图）
  - 文件类型限制（jpg/png/webp，最大 5MB）
  - 图片自动压缩（WebP 转换）
  - 缩略图生成

存储方案：
  - 用户服务器本地存储（/opt/lynx/storage/）
  - 或接入用户自己的 OSS（阿里云/腾讯云，配置化）
  - 默认本地存储，零配置
```

#### 6.2.4 通知系统

```
功能：
  - 站内通知（消息中心）
  - 邮件通知（配置 SMTP 后启用）
  - 短信通知（配置短信服务商后启用）
  - 推送通知（PWA Web Push）

通知场景（按模板预设）：
  - Service-Booking：预约成功、预约提醒、预约取消
  - Light-Commerce：订单确认、发货通知、退款通知
  - Event-Manage：报名成功、活动提醒、签到确认
```

#### 6.2.5 数据备份/导出

```
功能：
  - 数据库自动备份（每日凌晨 3 点，保留 7 天）
  - 手动备份（一键导出）
  - 数据导出（Excel/CSV，用户数据、订单数据、预约数据）
  - 数据导入（Excel 批量导入）

实现：
  - pg_dump 定时任务（Docker 容器内 cron）
  - 备份文件存储在 /opt/lynx/backups/
```

#### 6.2.6 SEO/分享优化

```
功能：
  - 自动生成页面标题、描述、关键词
  - Open Graph 标签（分享卡片）
  - 自动生成 sitemap.xml
  - 自动生成 robots.txt
  - 结构化数据（Schema.org）

实现：
  - Next.js Metadata API
  - 模板预设默认值，用户可修改
```

#### 6.2.7 访问统计

```
功能：
  - 页面 PV/UV（简单计数，无用户追踪）
  - 来源分析（Referrer）
  - 设备分析（移动端/桌面端比例）
  - 管理后台数据看板

实现：
  - 自建轻量统计（不依赖 Google Analytics）
  - 数据存入 PostgreSQL，每日汇总
```

### 6.3 通用功能集成方式

```
模板基座代码中直接 import 通用组件：

import { LoginForm } from "@/components/auth/LoginForm";
import { UserMenu } from "@/components/auth/UserMenu";
import { DataTable } from "@/components/data/DataTable";
import { useAuth } from "@/lib/auth";

通用逻辑通过 lib 封装：

import { requireAuth } from "@/lib/auth";
import { uploadImage } from "@/lib/storage";
import { sendNotification } from "@/lib/notify";
```

---

## 7. 用户旅程

### 7.1 完整流程

```
用户打开 kit.lynx.ai
    │
    ├─ 注册/登录（与 LynxAI 账号打通）
    │
    ▼
进入控制台
    │
    ├─ 首次使用：引导添加服务器
    │   ├─ [添加已有服务器] → 填写 IP/账号/密码 → 测试连接 → 自动安装 Docker
    │   └─ [一键购买服务器] → 跳转阿里云 CPS → 粘贴实例信息 → 自动配置
    │
    ▼
点击"创建产品"
    │
    ├─ 选择产品类型（6 大类）
    │   ├─ 品牌展示（个人官网）
    │   ├─ 服务预约（教练/美容/咨询）
    │   ├─ 内容发布（博客/知识库）
    │   ├─ 电商交易（手作/知识付费）
    │   ├─ 活动管理（报名/签到）
    │   └─ 管理后台（CRM/数据看板）
    │
    ▼
AI 需求澄清（5-12 个结构化问题）
    │
    ├─ 问题类型：文本输入 / 单选 / 多选 / 颜色选择 / 时间范围 / 图片上传
    ├─ 动态联动：选择"瑜伽"后，后续问题自动适配瑜伽场景
    ├─ 实时预览：每回答一个问题，右侧预览实时更新
    │
    ▼
确认生成
    │
    ├─ 平台选择对应架构模板
    ├─ AI 填充配置到模板基座
    ├─ 自动编译测试（平台内 Docker 沙箱）
    ├─ 编译通过 → 进入预览
    ├─ 编译失败 → 修复 Agent 自动修复（最多 3 次）
    │
    ▼
实时预览 + 对话修改
    │
    ├─ 左侧：对话输入框（"换个颜色""加一段简介"）
    ├─ 右侧：iframe 实时预览（支持手机/平板/桌面切换）
    ├─ 每次修改：AI 重写代码 → 重新编译 → 预览刷新
    ├─ 修改历史：可查看/回滚到任意版本
    │
    ▼
一键发布
    │
    ├─ 平台通过 SSH 推送代码到用户服务器
    ├─ 自动执行 docker-compose up -d
    ├─ Caddy 自动配置反向代理 + SSL 证书
    ├─ 健康检查（curl 检测）
    ├─ 返回访问地址：https://xxx.lynx.run
    │
    ▼
产品上线
    │
    ├─ 用户获得：独立域名网站 + PWA（可添加到手机主屏幕）
    ├─ 管理后台：独立入口，登录后管理数据
    ├─ 后续修改：回到 Lynx Kit，对话修改后重新发布
    └─ 数据查看：管理后台查看预约/订单/用户数据
```

### 7.2 关键交互设计

#### 7.2.1 需求澄清界面

```
┌──────────────────────────────────────────────┐
│  Lynx 助手                                    │
│  ─────────────────────────────────────        │
│                                               │
│  你好！我来帮你做一个服务预约系统。           │
│  请回答以下问题，这样我能做出最符合你需求的    │
│  产品。                                       │
│                                               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━          │
│  问题 1/8                                     │
│                                               │
│  你的服务名称/品牌名是什么？                  │
│                                               │
│  ┌────────────────────────────────────┐      │
│  │ Sarah 瑜伽工作室                    │      │
│  └────────────────────────────────────┘      │
│                                               │
│  [ 下一步 ]                                   │
│                                               │
│  ● ○ ○ ○ ○ ○ ○ ○                              │
└──────────────────────────────────────────────┘
```

#### 7.2.2 实时预览界面

```
┌──────────────────────────────────────────────────────────────┐
│  我的产品 - Sarah 瑜伽工作室                        [发布]  │
├──────────────────┬─────────────────────────────────────────┤
│                  │                                         │
│  💬 与 AI 对话修改 │  📱 手机    💻 桌面                     │
│                  │                                         │
│  你：换个暖橙色   │  ┌─────────────────────────┐           │
│  AI：已更新       │  │                         │           │
│                  │  │   Sarah 瑜伽工作室      │           │
│  你：加一段简介   │  │   ─────────────────     │           │
│  AI：已添加       │  │   专注流瑜伽与冥想      │           │
│                  │  │                         │           │
│  ─────────────── │  │   [立即预约]            │           │
│                  │  │                         │           │
│  输入修改指令...  │  │   关于我                │           │
│  [发送]          │  │   瑜伽教练，10年经验... │           │
│                  │  │                         │           │
│  历史版本：      │  └─────────────────────────┘           │
│  ● 当前        │                                         │
│  ○ 5分钟前     │                                         │
│  ○ 10分钟前    │                                         │
│                  │                                         │
└──────────────────┴─────────────────────────────────────────┘
```

---

## 8. Agent 编排引擎

### 8.1 七层 Agent 架构

```
用户输入需求
    │
    ▼
┌────────────────────────────────────────────┐
│  ① 意图识别 Agent（Claude Haiku 4.5）       │
│  ─────────────────────────────────────      │
│  输入：自然语言                              │
│  输出：产品类型（static/booking/content/     │
│        commerce/event/admin）+ 置信度        │
│  成本：极低                                  │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────┐
│  ② 需求澄清 Agent（自研规则引擎）            │
│  ─────────────────────────────────────      │
│  输入：产品类型 + 用户回答                    │
│  输出：结构化 JSON 配置                       │
│  逻辑：根据 template.json 的问题配置，        │
│        动态生成问答流程                       │
│  成本：无（规则引擎，不调用 LLM）             │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────┐
│  ③ 模板选择 Agent（自研）                    │
│  ─────────────────────────────────────      │
│  输入：产品类型                               │
│  输出：对应模板基座路径 + 版本号              │
│  逻辑：查表，直接匹配                         │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────┐
│  ④ 配置填充 Agent（Claude Sonnet 4.6）       │
│  ─────────────────────────────────────      │
│  输入：模板基座 + JSON 配置                   │
│  输出：完整项目代码包                         │
│  策略：替换占位符，生成动态内容，             │
│        保持模板骨架不变                       │
│  成本：中等（50K-100K tokens/次）             │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────┐
│  ⑤ 编译测试 Agent（自研 Docker 沙箱）        │
│  ─────────────────────────────────────      │
│  输入：项目代码包                             │
│  输出：编译结果（成功/失败）+ 错误日志        │
│  逻辑：临时容器内 npm run build               │
└────────────────┬─────────────────────────────┘
                 │ 编译失败？
      ┌──────────┴──────────┐
      ▼                     ▼
    成功                  失败
      │                     │
      │                     ▼
      │   ┌─────────────────────────────────────────┐
      │   │ ⑥ 修复 Agent（Claude Sonnet 4.6）       │
      │   │ ─────────────────────────────────────    │
      │   │ 输入：错误日志 + 相关代码文件            │
      │   │ 输出：修复后的代码                       │
      │   │ 策略：L1 静默修复（自动，最多 3 次）     │
      │   │       L2 引导修复（问用户选择题）       │
      │   │       L3 回滚（放弃本次修改）           │
      │   └─────────────────────────────────────────┘
      │                     │
      └─────────┬───────────┘
                │
                ▼
┌────────────────────────────────────────────┐
│  ⑦ 部署 Agent（NodeSSH + Docker Compose）   │
│  ─────────────────────────────────────      │
│  输入：项目代码包 + 服务器配置                │
│  输出：部署结果 + 访问地址                    │
│  步骤：SSH → 上传 → docker-compose up →     │
│        Caddy 配置 → 健康检查                │
└────────────────────────────────────────────┘
```

### 8.2 修复 Agent 详细策略

| 级别 | 触发条件 | 处理方式 | 用户感知 | 最大重试 |
|------|----------|----------|----------|----------|
| **L1 静默修复** | 编译错误、依赖缺失、类型错误、简单语法错误、导入路径错误 | AI 自动分析错误日志，定位问题文件，重写修复后重新编译 | 预览自动刷新，右下角显示"已自动修复"Toast | 3 次 |
| **L2 引导修复** | 逻辑错误、功能不符合预期、AI 无法确定用户意图、样式冲突 | 用大白话问用户选择题（A/B/C），1 秒完成 | 底部弹出选择卡片，选择后立即生效 | 2 次 |
| **L3 安全回滚** | 致命错误、多次修复失败、模板骨架损坏、内存溢出 | 自动 git reset 到上一可用版本，保留用户配置 | 弹窗提示"已恢复至上一版本，请重新描述需求" | 1 次 |

### 8.3 意图识别示例

```typescript
// 意图识别 Agent
async function classifyIntent(userInput: string): Promise<{
  type: string;
  confidence: number;
}> {
  const keywords: Record<string, string[]> = {
    "static-site": ["官网", "网站", "主页", "介绍", "展示", "作品集", "portfolio", "landing"],
    "booking": ["预约", "预订", "档期", "时间", "教练", "美容", "咨询", "拍摄"],
    "content": ["博客", "文章", "内容", "newsletter", "知识库", "文档"],
    "commerce": ["商城", "卖", "购买", "商品", "店铺", "付费", "会员", "订阅"],
    "event": ["活动", "报名", "签到", "会议", "课程", "聚会", "沙龙"],
    "admin": ["管理", "后台", "CRM", "数据", "看板", "统计", "工具"],
  };

  // 快速规则匹配（不调用 LLM，零成本）
  for (const [type, words] of Object.entries(keywords)) {
    if (words.some((w) => userInput.includes(w))) {
      return { type, confidence: 0.9 };
    }
  }

  // 规则未命中，调用 Haiku 做语义理解
  const response = await anthropic.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 100,
    messages: [{
      role: "user",
      content: `用户需求："${userInput}"

请判断最接近的产品类型：
1. 品牌展示（官网/作品集）
2. 服务预约（教练/美容/咨询预约）
3. 内容发布（博客/知识库）
4. 电商交易（商城/付费）
5. 活动管理（报名/签到）
6. 管理后台（CRM/数据看板）

只输出类型编号和置信度（0-1），格式：类型,置信度`
    }],
  });

  // 解析结果...
}
```

---

## 9. 数据模型

### 9.1 平台数据库（PostgreSQL）

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 用户表（与 LynxAI 账号打通）
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  avatar    String?
  phone     String?  @unique
  lynxAiId  String?  @unique
  role      String   @default("user")  // user, admin
  status    String   @default("active") // active, suspended
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  servers  Server[]
  projects Project[]
}

// 服务器表（用户自有服务器）
model Server {
  id                String   @id @default(cuid())
  userId            String
  name              String
  ip                String
  port              Int      @default(22)
  username          String
  encryptedPassword String   // AES-256-GCM 加密
  sshKey            String?  // 可选：SSH 密钥
  status            String   @default("pending")
  dockerReady       Boolean  @default(false)
  caddyReady        Boolean  @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  projects Project[]

  @@index([userId])
}

// 项目表（用户创建的产品）
model Project {
  id        String   @id @default(cuid())
  userId    String
  serverId  String
  name      String
  type      String   // static-site, booking, content, commerce, event, admin
  config    Json     @default("{}")  // 用户回答生成的配置
  status    String   @default("draft") // draft, clarifying, generating, building, deployed, error
  domain    String?  // xxx.lynx.run 或自定义域名
  customDomain String? // 用户自定义域名
  version   Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user   User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  server Server      @relation(fields: [serverId], references: [id])
  logs   DeployLog[]
  versions ProjectVersion[]

  @@index([userId])
  @@index([serverId])
}

// 项目版本表（用于回滚）
model ProjectVersion {
  id        String   @id @default(cuid())
  projectId String
  version   Int
  config    Json     // 该版本的配置快照
  codeHash  String   // 代码包哈希
  createdAt DateTime @default(now())

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
}

// 部署日志表
model DeployLog {
  id        String   @id @default(cuid())
  projectId String
  status    String   @default("pending") // pending, success, failed
  logs      String   @default("")       // 部署过程日志
  duration  Int?     // 部署耗时（秒）
  error     String?  // 错误信息
  createdAt DateTime @default(now())

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
}

// 模板表（平台模板库）
model Template {
  id          String   @id @default(cuid())
  type        String   @unique // static-site, booking, content, commerce, event, admin
  name        String
  description String
  version     String   @default("1.0.0")
  questions   Json     // template.json 的问题配置
  configMap   Json     // 配置映射规则
  basePath    String   // 模板基座路径
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 9.2 用户产品数据库（用户服务器上的 PostgreSQL）

每个用户产品的数据库独立运行在其自有服务器上，平台不托管。

**通用数据模型（所有模板共享）：**

```prisma
// 用户产品中的 prisma/schema.prisma

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  avatar    String?
  phone     String?  @unique
  role      String   @default("user")  // user, admin
  status    String   @default("active")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 业务关联（按模板类型动态扩展）
  bookings  Booking[]  // service-booking
  orders    Order[]    // light-commerce
  registrations Registration[] // event-manage
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
}

// 通知表（通用）
model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String   // email, sms, push, in-app
  title     String
  content   String
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
}

// 文件表（通用）
model File {
  id        String   @id @default(cuid())
  userId    String?
  filename  String
  url       String
  mimeType  String
  size      Int
  createdAt DateTime @default(now())
}
```

**业务数据模型（按模板类型）：**

```prisma
// service-booking 模板扩展
model Booking {
  id          String   @id @default(cuid())
  userId      String
  customerName String
  customerPhone String
  customerEmail String?
  date        DateTime
  startTime   String   // HH:mm
  endTime     String   // HH:mm
  serviceType String?
  status      String   @default("pending") // pending, confirmed, completed, cancelled
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])
}

// light-commerce 模板扩展
model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Decimal  @db.Decimal(10, 2)
  stock       Int      @default(0)
  images      String[]
  status      String   @default("active")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  orderItems OrderItem[]
}

model Order {
  id        String   @id @default(cuid())
  userId    String
  status    String   @default("pending") // pending, paid, processing, shipped, completed, cancelled
  total     Decimal  @db.Decimal(10, 2)
  address   Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user       User        @relation(fields: [userId], references: [id])
  orderItems OrderItem[]
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  productId String
  quantity  Int
  price     Decimal @db.Decimal(10, 2)

  order   Order   @relation(fields: [orderId], references: [id])
  product Product @relation(fields: [productId], references: [id])
}
```

---

## 10. 安全架构

### 10.1 数据安全

| 数据类型 | 存储方式 | 加密方式 | 备注 |
|----------|----------|----------|------|
| SSH 密码 | 平台数据库 | AES-256-GCM | 主密钥在环境变量，不提交代码 |
| SSH 密钥 | 平台数据库 | AES-256-GCM | 同上 |
| 用户业务数据 | 用户自有服务器 | 不加密（用户负责） | 平台不触碰 |
| 平台用户密码 | 平台数据库 | bcrypt | 不存储明文 |
| JWT Token | 客户端 | HS256 签名 | 过期时间 1 小时 |

### 10.2 传输安全

- 平台全站 HTTPS（Cloudflare）
- SSH 连接使用密钥优先（密码为备选）
- API 请求带 JWT 签名
- WebSocket 使用 wss

### 10.3 部署安全

```typescript
// SSH 操作沙箱
const ALLOWED_COMMANDS = [
  "docker", "docker-compose", "git", "node", "npm", "pnpm",
  "mkdir", "cp", "mv", "rm", "chmod", "ls", "cat", "curl"
];
const BLOCKED_PATHS = ["/etc", "/usr", "/var", "/root", "/home"];
const PROJECT_ROOT = "/opt/lynx/projects";

function validateCommand(cmd: string) {
  const base = cmd.split(" ")[0];
  if (!ALLOWED_COMMANDS.includes(base)) {
    throw new Error(`Command not allowed: ${base}`);
  }
  if (cmd.includes("..") || BLOCKED_PATHS.some((p) => cmd.includes(p))) {
    throw new Error("Path traversal detected");
  }
  // 只允许操作项目目录
  if (!cmd.includes(PROJECT_ROOT)) {
    throw new Error("Can only operate within project directory");
  }
}
```

### 10.4 平台安全

- **SQL 注入**：Prisma ORM 参数化查询，零风险
- **XSS**：React 自动转义，富文本用 DOMPurify
- **CSRF**：Next.js 内置 CSRF 保护
- **Rate Limit**：Redis 限流，单 IP 10 次/分钟
- **代码注入**：模板引擎严格白名单，用户输入不能直接写入代码文件
- **文件上传**：限制类型（jpg/png/webp），限制大小（5MB），病毒扫描

---

## 11. 扩展性规划

### 11.1 从 MVP 到规模化

```
Phase 1: MVP（Month 1-3）
  - 2 个模板：personal-website + service-booking
  - Web 端 + PWA
  - 用户自带服务器
  - Claude Sonnet 主力
  - Vercel Pro + 单 PostgreSQL

Phase 2: 增长（Month 4-6）
  - 6 个模板全部上线
  - 管理后台模板
  - 阿里云 CPS 一键购买
  - 自定义域名绑定
  - 多模型负载均衡（Claude + DeepSeek）

Phase 3: 生态（Month 7-12）
  - 模板市场（用户可提交模板）
  - 插件系统（支付、短信、邮件等第三方接入）
  - 团队协作（多成员管理）
  - 数据分析（用户行为、转化漏斗）
  - 自研代码小模型（降低 API 成本）

Phase 4: 平台化（Year 2+）
  - 服务器托管服务（用户可租用平台服务器）
  - 多区域部署
  - 企业版（私有化部署）
  - 开发者生态（API、SDK）
```

### 11.2 水平扩展点

| 瓶颈 | 扩展方案 | 触发条件 |
|------|----------|----------|
| 代码生成队列堆积 | 增加 Worker 实例（无状态，任意扩展） | 队列长度 > 100 |
| Claude API 限流 | 接入 DeepSeek-V3 降级，多 Key 轮询 | 错误率 > 5% |
| 平台数据库压力 | 读写分离，缓存热点数据 | CPU > 70% |
| 用户产品并发 | 用户自己升级服务器（与平台无关） | N/A |
| 模板存储 | 对象存储（OSS/S3） | 模板数量 > 100 |

---

## 12. 四周迭代路线

### Week 1：脚手架 + 账号 + 服务器管理

**目标**：搭建项目骨架，实现核心基础设施

| 模块 | 功能点 | 验收标准 |
|------|--------|----------|
| 项目搭建 | Next.js 15 + tRPC + Prisma + Tailwind | `pnpm dev` 能跑通，无报错 |
| 数据库 | Prisma Schema 初始化，推送数据库 | `pnpm db:push` 成功，表结构正确 |
| 登录 | 简单邮箱登录（MVP 阶段无 LynxAI SSO） | 能注册、登录、看到控制台 |
| 服务器 | 添加服务器表单 + SSH 测试连接 | 填写 IP/密码后，显示"连接成功" |
| 服务器 | Docker 状态检测 | 连接成功后，显示"Docker 已就绪"或"未安装" |

**Trae Solo 指令**：
> "创建一个 Next.js 15 项目，App Router，TypeScript，Tailwind CSS。集成 tRPC 和 Prisma。实现登录页（邮箱+密码）、控制台首页、服务器添加页（IP/端口/用户名/密码表单+测试连接按钮）。数据库 Schema 包含 User 和 Server 表。所有组件用 Tailwind 手写，不使用 shadcn/ui（后续再集成）。代码注释用中文。"

### Week 2：需求澄清 + 模板引擎 + 第一个模板

**目标**：跑通"个人官网"从创建到生成的完整链路

| 模块 | 功能点 | 验收标准 |
|------|--------|----------|
| 模板引擎 | 读取 template.json，渲染动态问题表单 | 选择"个人官网"后，出现 5 个问题 |
| 需求澄清 | 用户回答问题，生成 JSON 配置 | 回答完成后，数据库 config 字段有值 |
| 代码生成 | 调用 Claude API，填充模板基座 | 生成完整代码包（至少 5 个文件） |
| 编译测试 | 平台内 Docker 沙箱编译 | 编译通过，无致命错误 |
| 预览 | iframe 渲染生成的页面 | 浏览器能看到预览效果 |

**Trae Solo 指令**：
> "实现模板引擎：1）创建 templates/personal-website/ 目录，包含 template.json（定义 5 个问题）、page.tsx 基座（含 {{heroTitle}} 占位符）、docker-compose.yml。2）实现需求澄清页面：读取 template.json，动态渲染问题表单（文本输入+单选），提交后生成 JSON 配置。3）实现代码生成：调用 Claude API（用模拟数据），将配置填充到模板，输出完整代码包。4）实现编译测试：在临时目录写入代码，执行 npm run build，返回结果。"

### Week 3：部署 + 域名 + 修复 Agent

**目标**：实现一键部署到用户服务器，域名自动配置

| 模块 | 功能点 | 验收标准 |
|------|--------|----------|
| 部署 | SSH 推送代码到用户服务器 | 代码出现在 /opt/lynx/projects/ 下 |
| 部署 | Docker Compose 启动 | `docker ps` 能看到运行中的容器 |
| 域名 | 子域名自动分配（xxx.lynx.run） | 浏览器能访问子域名 |
| 修复 | L1 静默修复（编译错误） | 故意引入错误，AI 自动修复后编译通过 |
| 修复 | L2 引导修复（逻辑错误） | 模拟逻辑错误，弹出选择题 |

**Trae Solo 指令**：
> "实现部署模块：1）用 node-ssh 连接用户服务器，上传代码到 /opt/lynx/projects/{id}/。2）执行 docker-compose up -d。3）配置 Caddy（写入 Caddyfile，反向代理到 localhost:3000）。4）健康检查（curl localhost:3000）。实现修复 Agent：1）编译错误分类器（正则匹配）。2）L1 修复：将错误日志传给 Claude API，返回修复后的代码。3）L2 修复：逻辑错误时返回选择题选项。"

### Week 4：端到端验证 + 第二个模板

**目标**：找真实用户跑通全流程，上线 service-booking 模板

| 模块 | 功能点 | 验收标准 |
|------|--------|----------|
| 测试 | 3 个非技术用户独立完成从注册到上线 | 无人工介入，成功率 > 80% |
| 模板 | service-booking 模板开发 | 包含预约页、管理后台、时段管理 |
| 优化 | 根据用户反馈修复体验问题 | 关键路径无阻塞 |
| 文档 | 编写用户引导文档 | 首次使用能独立完成 |

**Trae Solo 指令**：
> "创建 service-booking 模板：1）template.json 定义 8 个问题（服务类型、名称、时段、价格等）。2）基座代码包含：首页（服务介绍）、预约页（时段选择+表单）、管理后台（预约列表+日历视图）。3）集成通用功能：用户登录、预约数据存储、时段冲突检测。4）根据测试反馈优化个人官网模板的交互细节。"

---

## 13. 关键指标

| 指标 | 目标 | 说明 |
|------|------|------|
| **部署成功率** | > 80% | 用户点击发布后，能正常访问的比例 |
| **端到端转化率** | > 30% | 注册 → 成功创建并部署产品的比例 |
| **代码生成可用率** | > 90% | 生成代码能编译运行、无致命错误 |
| **L1 修复成功率** | > 70% | 编译错误被自动修复的比例 |
| **用户满意度** | NPS > 50 | 上线后用户是否愿意推荐给朋友 |
| **首次部署耗时** | < 60 秒 | 从点击发布到可访问的耗时 |
| **模板扩展时间** | < 2 周 | 新增一个模板从开发到上线的时间 |

---

> **文档版本**：v0.2  
> **更新日期**：2026-07-01  
> **状态**：架构定稿，进入开发阶段
