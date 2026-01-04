/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../shared/src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0F172A',
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        indigo: {
          DEFAULT: '#4338CA',
          50: '#EEF2FF',
          100: '#E0E7FF',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4338CA',
          700: '#3730A3',
        },
        coral: {
          DEFAULT: '#FF5733',
          50: '#FFF1F0',
          100: '#FFE4E1',
          400: '#FF8A7A',
          500: '#FF5733',
          600: '#E6391F',
        },
        mint: {
          DEFAULT: '#10B981',
          50: '#ECFDF5',
          100: '#D1FAE5',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
        },
        grey: {
          DEFAULT: '#F1F5F9',
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
        },
      },
      fontFamily: {
        sans: ['Barlow', 'system-ui', 'sans-serif'],
        condensed: ['Barlow Condensed', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};