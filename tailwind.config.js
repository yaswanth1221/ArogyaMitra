/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7f4',
          100: '#d5ece4',
          200: '#aad9ca',
          500: '#2f8f78',
          600: '#1f7360',
          700: '#195c4d',
          800: '#154a3f',
          900: '#0f342d',
        },
        paper: '#f6f4ee',
        ink: '#17231f',
        saffron: { 100: '#fdebc8', 500: '#e08a12', 700: '#9a5a05' },
        alert: { 50: '#fdecec', 600: '#c62828', 700: '#a31f1f', 900: '#6e1313' },
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'system-ui', '-apple-system', 'Roboto', '"Noto Sans"', '"Noto Sans Devanagari"', 'sans-serif'],
        display: ['Georgia', '"Noto Serif"', 'serif'],
      },
    },
  },
  plugins: [],
};
