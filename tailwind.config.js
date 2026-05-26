/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'dark': '#080d0b',
        'dark-2': '#0f1a14',
        'green-deep': '#0d3320',
        'green-mid': '#1a5c3a',
        'green-accent': '#2d8653',
        'green-bright': '#52b788',
        'gold': '#c9a84c',
        'gold-light': '#e8c97a',
        'glass': 'rgba(255,255,255,0.06)',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        japanese: ['Noto Serif JP', 'serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 4s ease-in-out infinite',
        'fade-up': 'fadeUp 1s ease-out forwards',
        'line-grow': 'lineGrow 1.5s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.6', filter: 'blur(20px)' },
          '50%': { opacity: '1', filter: 'blur(30px)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        lineGrow: {
          from: { width: '0%' },
          to: { width: '100%' },
        },
      },
    },
  },
  plugins: [],
}
