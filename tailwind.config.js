/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#dfeeff',
          200: '#bfdcff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e3a8a',
          900: '#14213d',
        },
        paper: '#f4f8f6',
        ink: '#111827',
        mint: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
        },
        saffron: { 100: '#fff7ed', 500: '#f59e0b', 700: '#b45309' },
        alert: { 50: '#fff1f2', 600: '#ef4444', 700: '#b91c1c', 900: '#641b1b' },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'Roboto', 'sans-serif'],
        display: ['Poppins', 'Inter', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 12px 28px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
};
