/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F8F9F5',
        'bg-2': '#FFFFFF',
        'text-main': '#1C2016',
        'text-sub': '#4A5240',
        'text-light': '#8A9280',
        accent: '#6AB628',
        'accent-dark': '#4A8018',
        'accent-light': '#A8D860',
        'accent-bg': '#EFF8E8',
        border: '#E0E8D8',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        jp: ['Noto Sans JP', 'Noto Serif JP', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
