/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        govblue: {
          50: '#f0f6fc',
          100: '#e1eefb',
          200: '#bcdcfa',
          300: '#82c2f6',
          400: '#43a2f0',
          500: '#1d83e2',
          600: '#0f67c2',
          700: '#0d529e',
          800: '#0f4682',
          900: '#123c6d',
          950: '#0c264a',
        },
      },
    },
  },
  plugins: [],
}
