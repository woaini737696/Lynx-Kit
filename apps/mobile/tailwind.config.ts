/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        lynx: {
          50: '#FFF7ED',
          500: '#FF6B35',
          600: '#EA580C',
          700: '#C2410C',
        },
      },
    },
  },
  plugins: [],
};
