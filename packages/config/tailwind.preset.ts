import type { Config } from 'tailwindcss';

/**
 * LynxKit Tailwind 预设
 *
 * 设计语言（见 DESIGN_SYSTEM.md）：
 * - 极简黑白灰 + iOS 26 Liquid Glass 毛玻璃质感
 * - lynx 品牌色保留为暖橙（兼容移动端旧设计）
 * - ink 8 级灰阶作为 Web 端主色调（DESIGN_SYSTEM 规范）
 * - glass 工具类提供 iOS26 毛玻璃质感
 *
 * content 默认空数组，由各 app 自行填充扫描路径。
 */
const preset: Partial<Config> = {
  darkMode: 'class',
  content: [],
  theme: {
    extend: {
      colors: {
        // lynx 品牌色（暖橙，兼容旧设计；新 Web 页面应优先使用 ink）
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
        // ink 8 级灰阶（DESIGN_SYSTEM 主色调）
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
      },
      fontFamily: {
        // SF Pro Display / Text 优先（iOS26 风格）
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          '"SF Mono"',
          '"JetBrains Mono"',
          '"Cascadia Code"',
          'monospace',
        ],
      },
      borderRadius: {
        // iOS26 大圆角
        sm: '8px',
        DEFAULT: '12px',
        md: '16px',
        lg: '24px',
        xl: '28px',
      },
      boxShadow: {
        // Liquid Glass 阴影
        glass:
          '0 8px 32px rgba(15, 23, 42, 0.08), 0 1px 0 rgba(255,255,255,0.6) inset, 0 -1px 0 rgba(15,23,42,0.03) inset',
        'glass-lg':
          '0 20px 60px rgba(15,23,42,0.2), 0 1px 0 rgba(255,255,255,0.8) inset',
        'btn-dark': '0 4px 14px rgba(0,0,0,0.18)',
      },
      transitionTimingFunction: {
        'ios': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-out': {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up-sm': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(1.4)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        'fade-out': 'fade-out 0.15s ease-in',
        'slide-up': 'slide-up 0.5s ease-out',
        'slide-up-sm': 'slide-up-sm 0.25s ease-out',
        'scale-in': 'scale-in 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        float: 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default preset;
