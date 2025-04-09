/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#60A5FA',
          DEFAULT: '#3B82F6',
          dark: '#2563EB',
        },
        secondary: {
          light: '#F3F4F6',
          DEFAULT: '#E5E7EB',
          dark: '#D1D5DB',
        },
      },
      keyframes: {
        'pulse-fast': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.3 }
        },
        'pulse-border': {
          '0%, 100%': { borderColor: 'rgba(239, 68, 68, 0.7)' }, // red-500 with opacity
          '50%': { borderColor: 'rgba(239, 68, 68, 0.3)' }
        }
      },
      animation: {
        'pulse-fast': 'pulse-fast 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-border': 'pulse-border 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}

