/**
 * LynxKit 桌面端品牌图标生成器
 *
 * 程序化生成「文字 SVG 占位」logo，再用 @resvg/resvg-js 渲染为
 * 1024x1024 PNG，输出到 apps/desktop/build/icon.png 供 electron-builder 使用。
 *
 * 设计：深蓝紫渐变背景 + 中央 "LX" 字母组合 + 底部 "LynxKit" 字样
 *
 * 运行：node scripts/generate-icon.mjs
 */

import { Resvg } from "@resvg/resvg-js";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// 1024x1024 SVG —— electron-builder 推荐 PNG 至少 512，1024 兼容高 DPI
const SIZE = 1024;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#4C1D95"/>
    </linearGradient>
    <linearGradient id="lx" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#60A5FA"/>
      <stop offset="100%" stop-color="#A78BFA"/>
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- 圆角方形背景 -->
  <rect x="0" y="0" width="${SIZE}" height="${SIZE}" rx="200" ry="200" fill="url(#bg)"/>

  <!-- 装饰光斑 -->
  <circle cx="780" cy="240" r="120" fill="#A78BFA" opacity="0.18"/>
  <circle cx="240" cy="780" r="160" fill="#60A5FA" opacity="0.14"/>

  <!-- 中央 "LX" 字母组合 -->
  <text x="512" y="540" font-family="Inter, system-ui, -apple-system, Segoe UI, sans-serif"
        font-size="380" font-weight="800"
        text-anchor="middle" dominant-baseline="middle"
        fill="url(#lx)" filter="url(#glow)">LX</text>

  <!-- 底部品牌名 -->
  <text x="512" y="820" font-family="Inter, system-ui, -apple-system, Segoe UI, sans-serif"
        font-size="92" font-weight="600" letter-spacing="8"
        text-anchor="middle" dominant-baseline="middle"
        fill="#F8FAFC">LynxKit</text>

  <!-- 底部副标语 -->
  <text x="512" y="912" font-family="Inter, system-ui, -apple-system, Segoe UI, sans-serif"
        font-size="32" font-weight="400" letter-spacing="4"
        text-anchor="middle" dominant-baseline="middle"
        fill="#94A3B8">AI App Builder</text>
</svg>`;

const resvg = new Resvg(svg, {
  fitTo: { mode: "width", value: SIZE },
  background: "rgba(0,0,0,0)",
});

const pngBuffer = resvg.render().asPng();

const outDir = resolve(ROOT, "apps/desktop/build");
const outFile = resolve(outDir, "icon.png");

await mkdir(outDir, { recursive: true });
await writeFile(outFile, pngBuffer);

console.log(`✓ 图标已生成：${outFile}（${SIZE}x${SIZE} PNG, ${pngBuffer.length} bytes）`);
