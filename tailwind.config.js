/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./pages/**/*.html",
    "./scripts/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        'orange-primary': '#E67E3C',
        'orange-light': '#F39C5A',
        'orange-dark': '#C85A1C',
        'copper': '#B87333',
        'dark-gray': '#0A0A0A',
        'gray': '#1A1A1A',
        'light-gray': '#666666',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'georgia': ['Georgia', 'serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'slam': 'slam 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
        'shake': 'shake 0.5s ease-in-out',
        'wobble': 'wobble 1s ease-in-out',
      },
      backdropBlur: {
        'xl': '30px',
      },
      borderRadius: {
        'xl': '28px',
        'lg': '18px',
      },
    },
  },
  plugins: [],
}
