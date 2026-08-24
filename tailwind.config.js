/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#FBF9F4',
          surface: '#FFFFFF',
          muted: '#F3EFE6',
        },
        ink: {
          DEFAULT: '#262626',
          muted: '#D4CEBF',
        },
        text: {
          main: '#1C1917',
          muted: '#78716C',
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
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        hand: ['Caveat', 'Patrick Hand', 'cursive'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
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

