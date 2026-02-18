/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#E6F4FF',
          100: '#B3DEFF',
          200: '#80C9FF',
          300: '#4DB3FF',
          400: '#1A9EFF',
          500: '#0088E6', // Primary brand blue
          600: '#006DB8',
          700: '#00528A',
          800: '#00385C',
          900: '#001D2E',
        },
      },
    },
  },
  plugins: [],
}
