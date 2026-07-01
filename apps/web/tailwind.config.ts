import type { Config } from "tailwindcss";

// LynxKit 主题：以暖橙 #FF6B35 为主色，呼应"超级个体"的温度感
const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx,js,jsx,mdx}",
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
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
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
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
