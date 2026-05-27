/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'forest-dark': '#1a2e18',
        'forest-mid': '#2d5227',
        'forest-light': '#4a8c3f',
        'leaf-bright': '#6ab850',
        'sage': '#8ab880',
        'stone': '#9a8870',
        'stone-light': '#c4b8a4',
        'cream': '#f4f0e8',
        'morning': '#fffad0',
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        body: ['Jost', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float-gentle': 'floatGentle 8s ease-in-out infinite',
        'fade-up': 'fadeUp 1.2s ease-out forwards',
        'breathe': 'breathe 4s ease-in-out infinite',
      },
      keyframes: {
        floatGentle: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
