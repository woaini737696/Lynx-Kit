# @lynxkit/config

LynxKit monorepo 共享配置包，集中维护 ESLint / TypeScript / Tailwind / PostCSS / Biome 配置，供所有 app/package 复用。

## 配置说明

| 文件 | 用途 |
| --- | --- |
| `tsconfig.base.json` | TypeScript 基础配置（ES2022 + Bundler + strict），供 packages 通用继承。 |
| `tsconfig.nextjs.json` | 面向 Next.js app 的 TS 配置，继承 base 并注入 `next` 插件与 `@/*` 路径别名。 |
| `eslint.config.js` | ESLint flat config，继承 `@typescript-eslint/recommended`，禁止 `any`，限制 `console` 与未用变量。 |
| `biome.json` | Biome 格式化与 lint 配置（2 空格 / 100 列 / recommended 规则 + organizeImports）。 |
| `tailwind.preset.ts` | Tailwind 预设：`darkMode: class`、`lynx` 主品牌色（#FF6B35 系列），`content` 由各 app 自填。 |
| `postcss.config.js` | PostCSS 配置：`tailwindcss` + `autoprefixer`。 |

## 用法

在 app/package 的 `package.json` 中添加依赖：

```json
{
  "devDependencies": {
    "@lynxkit/config": "workspace:*"
  }
}
```

### TypeScript

```jsonc
// tsconfig.json
{
  "extends": "@lynxkit/config/tsconfig.nextjs.json"
}
```

### ESLint

```js
// eslint.config.js
import lynxConfig from '@lynxkit/config/eslint';
export default [...lynxConfig];
```

### Biome

```jsonc
// biome.json
{
  "extends": ["@lynxkit/config/biome.json"]
}
```

### Tailwind

```ts
// tailwind.config.ts
import preset from '@lynxkit/config/tailwind.preset';
export default {
  presets: [preset],
  content: ['./src/**/*.{ts,tsx}'],
};
```

### PostCSS

```js
// postcss.config.js
import config from '@lynxkit/config/postcss';
export default config;
```
