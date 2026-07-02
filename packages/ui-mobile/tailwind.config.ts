import type { Config } from 'tailwindcss';

/**
 * LynxKit ui-mobile Tailwind / NativeWind 配置
 * - 主品牌色 lynx-500 (#FF6B35)，与 ui-web 保持一致
 * - NativeWind v4 通过 babel 插件在编译期将 className 编译为 StyleSheet
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        lynx: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#FF6B35',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
      },
    },
  },
  plugins: [],
};

export default config;
