/** @type {import('tailwindcss').Config} */
const nasaColor = (name) => `rgb(var(--nasa-${name}-rgb) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        nasa: {
          bg: nasaColor('bg'),
          panel: nasaColor('panel'),
          border: nasaColor('border'),
          text: nasaColor('text'),
          accent: nasaColor('accent'),
          warn: nasaColor('warn'),
          danger: nasaColor('danger'),
          grid: nasaColor('grid'),
          dim: nasaColor('dim'),
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        phosphor: '0 0 8px rgba(var(--nasa-accent-rgb), 0.35)',
      },
    },
  },
  plugins: [],
}
