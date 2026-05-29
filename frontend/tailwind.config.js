/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: "#020402",
          900: "#050906",
          800: "#0d150e",
          700: "#142216",
          600: "#1a301e",
        },
        neon: {
          green: "#22c55e",
          mint: "#10b981",
          bright: "#4ade80",
          glow: "#86efac",
        },
        medical: {
          blue: "#3b82f6",
          light: "#60a5fa",
          dark: "#1e3a8a",
          glow: "#bfdbfe"
        }
      },
      boxShadow: {
        'neon-green': '0 0 15px rgba(34, 197, 94, 0.25)',
        'neon-green-lg': '0 0 25px rgba(34, 197, 94, 0.45)',
        'neon-red': '0 0 15px rgba(239, 68, 68, 0.35)',
        'neon-red-lg': '0 0 25px rgba(239, 68, 68, 0.55)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s infinite ease-in-out',
        'blink-red': 'blinkRed 1.5s infinite ease-in-out',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'shimmer': 'shimmer 3s linear infinite',
        'float-subtle': 'floatSubtle 6s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 15px rgba(34, 197, 94, 0.25)' },
          '50%': { transform: 'scale(1.02)', boxShadow: '0 0 25px rgba(34, 197, 94, 0.45)' },
        },
        blinkRed: {
          '0%, 100%': { opacity: 1, boxShadow: '0 0 15px rgba(239, 68, 68, 0.35)' },
          '50%': { opacity: 0.6, boxShadow: '0 0 25px rgba(239, 68, 68, 0.65)' },
        },
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        floatSubtle: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        }
      }
    },
  },
  plugins: [],
}
