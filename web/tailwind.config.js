/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#07080c',
          panel: '#0e111a',
          card: '#141724',
          border: '#1f2538',
          'border-light': '#2c354e',
          cyan: '#00f0ff',
          'cyan-muted': '#00b4c2',
          emerald: '#00ff88',
          amber: '#ffaa00',
          danger: '#ff3366',
          text: '#f1f5f9',
          muted: '#8e9bb0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(0, 240, 255, 0.35)',
        'neon-emerald': '0 0 15px rgba(0, 255, 136, 0.35)',
        'neon-danger': '0 0 15px rgba(255, 51, 102, 0.35)',
        'cyber-card': '0 4px 20px -2px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(31, 37, 56, 0.8)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: 0.6 },
          '50%': { opacity: 1 },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
      },
    },
  },
  plugins: [],
}
