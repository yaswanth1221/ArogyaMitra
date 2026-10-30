/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          500: '#4f46e5',
          600: '#4338ca',
          700: '#3730a3',
          800: '#312e81',
          900: '#1f1d4d',
        },
        paper: '#f4f7fb',
        ink: '#111827',
        saffron: { 100: '#fff7ed', 500: '#f59e0b', 700: '#b45309' },
        alert: { 50: '#fef2f2', 600: '#ef4444', 700: '#b91c1c', 900: '#641b1b' },
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'system-ui', '-apple-system', 'Roboto', '"Noto Sans"', '"Noto Sans Devanagari"', 'sans-serif'],
        display: ['"Segoe UI"', '"Noto Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
