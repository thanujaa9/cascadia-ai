/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cascadia: {
          bg: "#070707",
          panel: "#141414",
          panelHover: "#1b1b1b",
          border: "#262626",
          borderLight: "#333333",
          critical: "#F87171",
          criticalGlow: "rgba(248, 113, 113, 0.15)",
          warning: "#FBBF24",
          warningGlow: "rgba(251, 191, 36, 0.15)",
          healthy: "#4ADE80",
          healthyGlow: "rgba(74, 222, 128, 0.15)",
          textPrimary: "#F5F5F5",
          textMuted: "#A3A3A3",
          textDim: "#666666",
          accentCrimson: "#DC2626",
          accentIndigo: "#6366F1",
          accentCyan: "#06B6D4"
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: 0.9, transform: 'scale(1)' },
          '50%': { opacity: 0.4, transform: 'scale(1.04)' },
        },
        signalFlow: {
          '0%': { strokeDashoffset: '24' },
          '100%': { strokeDashoffset: '0' },
        }
      },
      animation: {
        pulseGlow: 'pulseGlow 2.5s infinite ease-in-out',
        signalFlow: 'signalFlow 1.2s linear infinite',
      }
    },
  },
  plugins: [],
}
