/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        instacart: {
          dark: '#003D29',
          green: '#0AAD05',
          orange: '#FF7009',
          text: '#343538',
          mid: '#72767E',
          light: '#F6F7F5',
          muted: '#9CA3AF',
          border: '#EAEAE8',
        }
      }
    },
  },
  plugins: [],
}
