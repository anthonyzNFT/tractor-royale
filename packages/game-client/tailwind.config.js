/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B35',
        secondary: '#F7931E',
        success: '#4CAF50',
        danger: '#F44336',
        warning: '#FFC107',
        info: '#2196F3',
      },
      fontFamily: {
        display: ['Impact', 'sans-serif'],
        body: ['Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
