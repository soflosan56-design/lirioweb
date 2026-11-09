/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pink: {
          50: '#FFF0F7',
          100: '#FFD6EA',
          300: '#FF7AC0',
          500: 'rgb(var(--c-primary) / <alpha-value>)',
          700: '#C4006A',
          900: '#6B0038',
        },
        neon: {
          100: '#FFF8C4',
          300: '#FFEB66',
          500: 'rgb(var(--c-accent) / <alpha-value>)',
          700: '#D9B400',
        },
        cyan: {
          300: '#FFFFFF',
          500: '#FF8CC6',
        },
        yellow: {
          100: '#FFF8C4',
          300: '#FFEB66',
          400: 'rgb(var(--c-accent) / <alpha-value>)',
          500: 'rgb(var(--c-accent) / <alpha-value>)',
          700: '#D9B400',
        },
        paper: {
          50: '#FFFFFF',
          100: 'rgb(var(--c-paper) / <alpha-value>)',
          200: '#FDE3EF',
        },
        ink: {
          900: 'rgb(var(--c-ink) / <alpha-value>)',
          800: '#1A1A1A',
          600: '#4A4A4A',
          400: '#8C8C8C',
        },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        hand: ['var(--font-hand)'],
      },
      boxShadow: {
        hard: '6px 6px 0 0 rgb(var(--c-ink))',
        'hard-sm': '3px 3px 0 0 rgb(var(--c-ink))',
        'hard-pink': '6px 6px 0 0 rgb(var(--c-primary))',
        'hard-neon': '6px 6px 0 0 rgb(var(--c-accent))',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.92) rotate(-2deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0)' },
        },
      },
      animation: {
        marquee: 'marquee 22s linear infinite',
        wiggle: 'wiggle 2.4s ease-in-out infinite',
        'pop-in': 'pop-in 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) backwards',
      },
    },
  },
  plugins: [],
};
