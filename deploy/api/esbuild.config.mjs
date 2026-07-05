// esbuild 配置 - 将 API + workspace 依赖打包为单文件
// 解决 Node ESM 目录导入 + CJS dynamic require 兼容性问题
//
// 迭代 14E：增加 build-worker 打包，集群模式下 Worker 作为独立 PM2 进程运行
import { build } from "esbuild";

await Promise.all([
  // 主 API 服务（Hono HTTP 服务）
  build({
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
  }),
  // 构建任务 Worker（BullMQ 队列消费者）
  build({
    entryPoints: ["apps/api/src/queues/build-worker.ts"],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: "deploy/api/dist/build-worker.js",
    target: "node20",
    sourcemap: false,
    external: ["pg-native", "bcrypt", "canvas", "sharp"],
    banner: {
      js: 'import { createRequire } from "module"; const require = createRequire(import.meta.url);',
    },
    logLevel: "info",
  }),
]);

console.log("✓ API bundle 生成: deploy/api/dist/index.js");
console.log("✓ Worker bundle 生成: deploy/api/dist/build-worker.js");
