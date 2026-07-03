// esbuild 配置 - 将 API + workspace 依赖打包为单文件
// 解决 Node ESM 目录导入 + CJS dynamic require 兼容性问题
import { build } from "esbuild";

await build({
  entryPoints: ["apps/api/src/index.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "deploy/api/dist/index.js",
  target: "node20",
  sourcemap: false,
  // native 模块不打包，运行时由 Node 加载（如果代码用到）
  external: ["pg-native", "bcrypt", "canvas", "sharp"],
  // 注入 createRequire，让 bundle 内的 CJS require 可用
  banner: {
    js: 'import { createRequire } from "module"; const require = createRequire(import.meta.url);',
  },
  logLevel: "info",
});

console.log("✓ API bundle 生成: deploy/api/dist/index.js");
