/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#4A1D8F',
          dark: '#3A1572',
          light: '#6B2FBF',
        },
        surface: {
          light: '#F0E9FF',
          page: '#F8F7FF',
        }
      }
    },
  },
  plugins: [],
}
