import type { Config } from "tailwindcss";

/**
 * LynxKit Desktop Tailwind 配置
 *
 * 沿用平台主题色 lynx（暖橙 #FF6B35），扫描本 app 的 src 与
 * @lynxkit/ui-web 组件源码以保证组件样式被正确收集。
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx,js,jsx,mdx}",
    "../../packages/ui-web/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lynx: {
          50: "#FFF4ED",
          100: "#FFE6D4",
          200: "#FFC8A8",
          300: "#FFA371",
          400: "#FF8757",
          500: "#FF6B35",
          600: "#F04E0E",
          700: "#C73C0B",
          800: "#9E2F0E",
          900: "#7F2810",
          950: "#451006",
        },
        // 8 级灰阶（DESIGN_SYSTEM.md §2）
        ink: {
          0: "#FFFFFF",
          50: "#FAFAFA",
          100: "#F5F5F7",
          200: "#EBEBEF",
          300: "#D8D8DE",
          400: "#A1A1AA",
          500: "#71717A",
          600: "#52525B",
          700: "#3F3F46",
          800: "#27272A",
          900: "#18181B",
          950: "#09090B",
        },
        // Liquid Glass 表层色板（DESIGN_SYSTEM.md §2 毛玻璃 Token）
        glass: {
          bg: "rgba(255,255,255,0.55)",
          "bg-strong": "rgba(255,255,255,0.72)",
          "bg-subtle": "rgba(255,255,255,0.35)",
          border: "rgba(255,255,255,0.7)",
          "border-subtle": "rgba(255,255,255,0.35)",
        },
        // shadcn/ui 语义色（HSL 字符串，便于主题切换）
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // DESIGN_SYSTEM.md §4 圆角
        card: "20px",
        xl: "28px",
        pill: "9999px",
      },
      fontFamily: {
        // DESIGN_SYSTEM.md §3 SF Pro 栈
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "SF Mono",
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "pulse-soft": "pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
