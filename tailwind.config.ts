import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: '#0f3d2e',
        moss: '#6f8f7c',
        gold: '#c9a646',
      },
      boxShadow: {
        glass: '0 8px 40px rgba(15, 61, 46, 0.12)'
      }
    },
  },
  plugins: [],
} satisfies Config
