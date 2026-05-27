/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bio: {
          bg:      '#0B130B',
          surface: '#111B11',
          text:    '#F5F3EC',
          muted:   '#A6B0A7',
          stroke:  '#1E2A1F',
          green:   '#5C8A63',
          sage:    '#8DAF74',
          gold:    '#C9B26B',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        widest2: '0.25em',
        widest3: '0.35em',
      },
      animation: {
        'mist-drift':   'mistDrift 18s ease-in-out infinite',
        'mist-drift-2': 'mistDrift2 24s ease-in-out infinite',
        'shaft-pulse':  'shaftPulse 8s ease-in-out infinite',
        'marquee':      'marquee 40s linear infinite',
        'spin-slow':    'spin 12s linear infinite',
      },
      keyframes: {
        mistDrift: {
          '0%, 100%': { transform: 'translateX(0px) translateY(0px)', opacity: '0.6' },
          '33%':      { transform: 'translateX(20px) translateY(-8px)', opacity: '1' },
          '66%':      { transform: 'translateX(-15px) translateY(6px)', opacity: '0.7' },
        },
        mistDrift2: {
          '0%, 100%': { transform: 'translateX(0px)', opacity: '0.4' },
          '50%':      { transform: 'translateX(-25px)', opacity: '0.8' },
        },
        shaftPulse: {
          '0%, 100%': { opacity: '0.6' },
          '50%':      { opacity: '1' },
        },
        marquee: {
          '0%':   { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}
