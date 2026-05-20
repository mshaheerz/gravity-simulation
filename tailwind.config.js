/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        nasa: {
          bg: '#000000',
          panel: '#0a0e0a',
          border: '#1a3a1a',
          text: '#b8ffb8',
          accent: '#00ff66',
          warn: '#ffb800',
          danger: '#ff3030',
          grid: '#0f1f0f',
          dim: '#3a6a3a',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        phosphor: '0 0 8px rgba(0, 255, 102, 0.35)',
      },
    },
  },
  plugins: [],
}
