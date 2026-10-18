/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        matcha: { 950: '#13260c', 900: '#1d3a12', 800: '#2c5419', 700: '#3f6f22', 500: '#7aa63a', 300: '#c6e06b' },
        lime: { soft: '#eaf59a', glow: '#dff07a', pale: '#f4f9d2' },
        sakura: { 50: '#fff6f4', 100: '#fde9e7', 200: '#f9d3d6', 300: '#f3b5be', 500: '#e07d8e', 600: '#c95f73' },
        cream: '#fbf3ee',
        ink: '#1b2a14',
      },
      fontFamily: {
        display: ['"Playfair Display"', '"Shippori Mincho"', 'serif'],
        script: ['"Allura"', 'cursive'],
        sans: ['"Zen Kaku Gothic New"', 'system-ui', 'sans-serif'],
        caps: ['"Josefin Sans"', '"Zen Kaku Gothic New"', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 18px 50px -20px rgba(29, 58, 18, 0.35)',
        card: '0 10px 30px -12px rgba(80, 40, 50, 0.25)',
      },
    },
  },
  plugins: [],
}
