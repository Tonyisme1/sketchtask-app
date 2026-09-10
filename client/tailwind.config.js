/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: 'var(--bg-canvas)',
          surface: 'var(--bg-surface)',
          muted: 'var(--bg-surface-muted)',
        },
        ink: {
          DEFAULT: 'var(--border-ink)',
          muted: 'var(--border-ink-muted)',
        },
        text: {
          main: 'var(--text-main)',
          muted: 'var(--text-muted)',
        },
        accent: {
          yellow: '#FEF08A',
          coral: '#FECDD3',
          mint: '#BBF7D0',
          sky: '#BAE6FD',
          lavender: '#DDD6FE',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        hand: ['var(--font-hand)'],
        mono: ['var(--font-sans)'],
      },
      boxShadow: {
        'ink-sm': '1.5px 1.5px 0px #262626',
        'ink-md': '2px 2px 0px #262626',
        'ink-lg': '4px 4px 0px #262626',
      },
    },
  },
  plugins: [],
}
