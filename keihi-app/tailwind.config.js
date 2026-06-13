/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: [
          'var(--font-zen)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI',
          'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', 'sans-serif',
        ],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        green: {
          50: '#f2f8f4',
          100: '#e1efe7',
          200: '#c3e0d0',
          300: '#97c8ad',
          400: '#64aa84',
          500: '#418c64',
          600: '#2f704e',
          700: '#275a40',
          800: '#214834',
          900: '#1c3c2c',
          950: '#0d2118',
        },
        sage: {
          50: '#f4f7f5',
          100: '#e4ede8',
          200: '#c8dbd1',
          300: '#a2c1b0',
          400: '#76a28a',
          500: '#5b8c6e',
          600: '#457057',
          700: '#375947',
          800: '#2e483b',
          900: '#273d32',
        },
        gold: {
          50: '#fbf8ef',
          100: '#f5ecd5',
          200: '#ead7a7',
          300: '#ddbe76',
          400: '#cfa64f',
          500: '#b88c35',
          600: '#9a712a',
          700: '#7a5823',
          800: '#5e441e',
          900: '#46331a',
        },
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(13 33 24 / 0.05), 0 1px 4px -1px rgb(13 33 24 / 0.06)',
        DEFAULT: '0 1px 3px 0 rgb(13 33 24 / 0.07), 0 4px 14px -3px rgb(13 33 24 / 0.06)',
        md: '0 2px 6px -1px rgb(13 33 24 / 0.08), 0 10px 28px -6px rgb(13 33 24 / 0.1)',
        lg: '0 4px 12px -2px rgb(13 33 24 / 0.1), 0 20px 48px -10px rgb(13 33 24 / 0.14)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
}
