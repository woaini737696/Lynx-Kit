/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // 8 级灰阶（DESIGN_SYSTEM.md §2）
        ink: {
          0: '#FFFFFF',
          50: '#FAFAFA',
          100: '#F5F5F7',
          200: '#EBEBEF',
          300: '#D8D8DE',
          400: '#A1A1AA',
          500: '#71717A',
          600: '#52525B',
          700: '#3F3F46',
          800: '#27272A',
          900: '#18181B',
          950: '#09090B',
        },
        lynx: {
          50: '#FFF7ED',
          500: '#FF6B35',
          600: '#EA580C',
          700: '#C2410C',
        },
      },
      fontFamily: {
        // SF Pro + PingFang SC 字体栈
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'SF Pro Text',
          'PingFang SC',
          'Hiragino Sans GB',
          'Microsoft YaHei',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
