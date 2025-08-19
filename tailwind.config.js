/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'display': ['Outfit', 'sans-serif'],
        'body': ['Inter', 'sans-serif'],
      },
      colors: {
        primary: '#2C5282',
        secondary: '#718096',
        accent: '#ED8936',
        surface: '#FFFFFF',
        background: '#F7FAFC',
        success: '#38A169',
        warning: '#D69E2E',
        error: '#E53E3E',
        info: '#3182CE'
      },
      boxShadow: {
        'card': '0 2px 4px rgba(0, 0, 0, 0.1)',
        'hover': '0 4px 8px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
}