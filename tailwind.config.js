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
        primary: {
          50: 'var(--color-primary-50, #f5f3ff)',
          100: 'var(--color-primary-100, #ede9fe)',
          200: 'var(--color-primary-200, #ddd6fe)',
          300: 'var(--color-primary-300, #c4b5fd)',
          400: 'var(--color-primary-400, #a78bfa)',
          500: 'var(--color-primary-500, #8b5cf6)',
          600: 'var(--color-primary-600, #7c3aed)',
          700: 'var(--color-primary-700, #6d28d9)',
          800: 'var(--color-primary-800, #5b21b6)',
          900: 'var(--color-primary-900, #4c1d95)',
        },
        theme: {
          surface: 'var(--theme-surface, #0d0b18)',
          border: 'var(--theme-border, rgba(139, 92, 246, 0.25))',
          accent: 'var(--theme-accent, #a78bfa)',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
