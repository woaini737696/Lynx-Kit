import type { Config } from 'tailwindcss';

/**
 * LynxKit Tailwind 预设
 *
 * 主品牌色 lynx 以暖橙 #FF6B35 系列为基准，呼应"超级个体"的温度感。
 * content 默认空数组，由各 app 自行填充扫描路径。
 *
 * 用法（在 app 的 tailwind.config.ts 中）：
 *   import preset from '@lynxkit/config/tailwind.preset';
 *   export default {
 *     presets: [preset],
 *     content: ['./src/**/*.{ts,tsx}'],
 *   } satisfies Config;
 */
const preset: Partial<Config> = {
  darkMode: 'class',
  content: [],
  theme: {
    extend: {
      colors: {
        lynx: {
          50: '#FFF4ED',
          100: '#FFE6D4',
          200: '#FFC8A8',
          300: '#FFA371',
          400: '#FF8757',
          500: '#FF6B35',
          600: '#F04E0E',
          700: '#C73C0B',
          800: '#9E2F0E',
          900: '#7F2810',
          950: '#451006',
        },
      },
    },
  },
  plugins: [],
};

export default preset;
